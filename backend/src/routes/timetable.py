from flask import Blueprint, jsonify

from extensions import get_db
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
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        lab_rows = list(db.labs.find({"college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1}).sort("id", 1))
        lab_ids = [row["id"] for row in lab_rows]

        timetable_rows = list(
            db.timetable.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "lab_id": 1, "mon_slot_id": 1, "tue_slot_id": 1, "wed_slot_id": 1, "thur_slot_id": 1, "fri_slot_id": 1})
        ) if lab_ids else []
        tt_map = {row["lab_id"]: row for row in timetable_rows}

        slot_ids = []
        for row in timetable_rows:
            for _, column in _DAY_COLUMNS:
                slot_id = row.get(column)
                if slot_id is not None:
                    slot_ids.append(slot_id)

        unique_slot_ids = list(set(slot_ids))
        slots = list(db.slots.find({"id": {"$in": unique_slot_ids}}, {"_id": 0, "id": 1, "course_id": 1, "faculty_id": 1, "class_id": 1})) if unique_slot_ids else []
        slots_map = {slot["id"]: slot for slot in slots}

        course_ids = list({slot.get("course_id") for slot in slots if slot.get("course_id") is not None})
        faculty_ids = list({slot.get("faculty_id") for slot in slots if slot.get("faculty_id") is not None})
        class_ids = list({slot.get("class_id") for slot in slots if slot.get("class_id") is not None})

        courses_map = {
            row["id"]: row
            for row in db.courses.find({"id": {"$in": course_ids}}, {"_id": 0, "id": 1, "name": 1, "duration_weeks": 1, "credits": 1})
        } if course_ids else {}
        faculty_map = {
            row["id"]: row
            for row in db.faculty.find({"id": {"$in": faculty_ids}}, {"_id": 0, "id": 1, "name": 1})
        } if faculty_ids else {}
        classes_map = {
            row["id"]: row
            for row in db.classes.find({"id": {"$in": class_ids}}, {"_id": 0, "id": 1, "division": 1, "year": 1})
        } if class_ids else {}

        meta_classes = {}
        meta_courses = {}
        meta_faculty = {}
        meta_labs = {}

        entries = []
        for lab_row in lab_rows:
            lab_no = str(lab_row["id"])
            lab_name = lab_row.get("name") or f"Computer Lab {lab_row['id']}"
            meta_labs[lab_row["id"]] = {"id": lab_row["id"], "labNo": lab_no, "name": lab_name, "floor": lab_row.get("floor")}

            tt = tt_map.get(lab_row["id"], {})
            for day_idx, (day_label, day_column) in enumerate(_DAY_COLUMNS):
                slot_id = tt.get(day_column)
                if slot_id is None:
                    continue

                slot = slots_map.get(slot_id)
                if not slot:
                    continue

                course = courses_map.get(slot.get("course_id"), {})
                faculty = faculty_map.get(slot.get("faculty_id"), {})
                cls = classes_map.get(slot.get("class_id"), {})
                class_name = _class_name(cls.get("division"), cls.get("year"))
                start_time, end_time = _TIME_WINDOWS[day_idx % len(_TIME_WINDOWS)]

                entries.append(
                    {
                        "id": f"{lab_row['id']}-{day_label.lower()}",
                        "dayOfWeek": day_label,
                        "startTime": start_time,
                        "endTime": end_time,
                        "labId": str(lab_row["id"]),
                        "labNo": lab_no,
                        "labName": lab_name,
                        "classId": str(slot.get("class_id")) if slot.get("class_id") is not None else "",
                        "className": class_name,
                        "courseId": str(slot.get("course_id")) if slot.get("course_id") is not None else "",
                        "courseName": course.get("name"),
                        "facultyId": str(slot.get("faculty_id")) if slot.get("faculty_id") is not None else "",
                        "facultyName": faculty.get("name"),
                    }
                )

                if slot.get("class_id") is not None:
                    meta_classes[slot["class_id"]] = {
                        "id": str(slot["class_id"]),
                        "name": class_name,
                        "division": cls.get("division"),
                        "year": cls.get("year"),
                    }
                if slot.get("course_id") is not None:
                    meta_courses[slot["course_id"]] = {
                        "id": str(slot["course_id"]),
                        "name": course.get("name"),
                        "durationWeeks": course.get("duration_weeks"),
                        "credits": course.get("credits"),
                    }
                if slot.get("faculty_id") is not None:
                    meta_faculty[slot["faculty_id"]] = {
                        "id": str(slot["faculty_id"]),
                        "name": faculty.get("name"),
                    }

        return jsonify({"success": True, "data": {"entries": entries, "meta": {"labs": list(meta_labs.values()), "classes": list(meta_classes.values()), "courses": list(meta_courses.values()), "faculty": list(meta_faculty.values())}}}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch timetable", "statusCode": 500, "details": str(exc)}), 500
