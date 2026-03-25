from flask import Blueprint, jsonify

from extensions import get_db_connection, get_dict_cursor
from .common import resolve_college


timetable_bp = Blueprint("timetable", __name__)

_DAY_COLUMNS = [
    ("Mon", "mon_slot_id"),
    ("Tue", "tue_slot_id"),
    ("Wed", "wed_slot_id"),
    ("Thu", "thur_slot_id"),
    ("Fri", "fri_slot_id"),
]

_TIME_WINDOWS = [
    ("08:00", "09:00"),
    ("09:00", "10:00"),
    ("10:00", "11:00"),
    ("11:00", "12:00"),
    ("12:00", "13:00"),
    ("13:00", "14:00"),
    ("14:00", "15:00"),
    ("15:00", "16:00"),
    ("16:00", "17:00"),
]


def _class_name(division, year):
    if division is None or year is None:
        return None
    return f"{division} (Year {year})"


@timetable_bp.get("/<college>/timetable")
def get_timetable(college: str):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT
                    l.id AS lab_id,
                    l.id AS lab_no,
                    l.name AS lab_name,
                    l.floor,
                    t.mon_slot_id,
                    t.tue_slot_id,
                    t.wed_slot_id,
                    t.thur_slot_id,
                    t.fri_slot_id
                FROM labs l
                LEFT JOIN timetable t ON t.lab_id = l.id
                WHERE l.college_id = %s
                ORDER BY l.id
                """,
                (college_row["id"],),
            )
            lab_rows = cur.fetchall()

            slot_ids = []
            for row in lab_rows:
                for _, column in _DAY_COLUMNS:
                    slot_id = row.get(column)
                    if slot_id is not None:
                        slot_ids.append(slot_id)

            slots_map = {}
            if slot_ids:
                cur.execute(
                    """
                    SELECT
                        s.id,
                        s.course_id,
                        c.name AS course_name,
                        c.duration_weeks,
                        c.credits,
                        s.faculty_id,
                        f.name AS faculty_name,
                        s.class_id,
                        cls.division,
                        cls.year
                    FROM slots s
                    LEFT JOIN courses c ON c.id = s.course_id
                    LEFT JOIN faculty f ON f.id = s.faculty_id
                    LEFT JOIN classes cls ON cls.id = s.class_id
                    WHERE s.id = ANY(%s)
                    """,
                    (list(set(slot_ids)),),
                )
                slots_map = {row["id"]: row for row in cur.fetchall()}

            classes_map = {}
            courses_map = {}
            faculty_map = {}
            labs_map = {}

            entries = []
            for lab_row in lab_rows:
                lab_no = str(lab_row["lab_no"])
                lab_name = lab_row["lab_name"] or f"Computer Lab {lab_row['lab_id']}"
                labs_map[lab_row["lab_id"]] = {
                    "id": lab_row["lab_id"],
                    "labNo": lab_no,
                    "name": lab_name,
                    "floor": lab_row["floor"],
                }

                for day_idx, (day_label, day_column) in enumerate(_DAY_COLUMNS):
                    slot_id = lab_row.get(day_column)
                    if slot_id is None:
                        continue

                    slot = slots_map.get(slot_id)
                    if not slot:
                        continue

                    start_time, end_time = _TIME_WINDOWS[day_idx % len(_TIME_WINDOWS)]
                    class_name = _class_name(slot.get("division"), slot.get("year"))

                    entries.append(
                        {
                            "id": f"{lab_row['lab_id']}-{day_label.lower()}",
                            "dayOfWeek": day_label,
                            "startTime": start_time,
                            "endTime": end_time,
                            "labId": str(lab_row["lab_id"]),
                            "labNo": lab_no,
                            "labName": lab_name,
                            "classId": str(slot["class_id"]) if slot.get("class_id") is not None else "",
                            "className": class_name,
                            "courseId": str(slot["course_id"]) if slot.get("course_id") is not None else "",
                            "courseName": slot.get("course_name"),
                            "facultyId": str(slot["faculty_id"]) if slot.get("faculty_id") is not None else "",
                            "facultyName": slot.get("faculty_name"),
                        }
                    )

                    if slot.get("class_id") is not None:
                        classes_map[slot["class_id"]] = {
                            "id": str(slot["class_id"]),
                            "name": class_name,
                            "division": slot.get("division"),
                            "year": slot.get("year"),
                        }
                    if slot.get("course_id") is not None:
                        courses_map[slot["course_id"]] = {
                            "id": str(slot["course_id"]),
                            "name": slot.get("course_name"),
                            "durationWeeks": slot.get("duration_weeks"),
                            "credits": slot.get("credits"),
                        }
                    if slot.get("faculty_id") is not None:
                        faculty_map[slot["faculty_id"]] = {
                            "id": str(slot["faculty_id"]),
                            "name": slot.get("faculty_name"),
                        }

            return (
                jsonify(
                    {
                        "success": True,
                        "data": {
                            "entries": entries,
                            "meta": {
                                "labs": list(labs_map.values()),
                                "classes": list(classes_map.values()),
                                "courses": list(courses_map.values()),
                                "faculty": list(faculty_map.values()),
                            },
                        },
                    }
                ),
                200,
            )
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to fetch timetable",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()
