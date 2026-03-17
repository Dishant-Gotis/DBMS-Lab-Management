from flask import Blueprint, jsonify, request

from extensions import get_db_connection, get_dict_cursor
from .common import resolve_college

faculty_bp = Blueprint("faculty", __name__)

_DAY_KEYS = ["mon", "tue", "wed", "thur", "fri"]
_DAY_COLUMN_MAP = {
    "mon": "mon_slot_id",
    "tue": "tue_slot_id",
    "wed": "wed_slot_id",
    "thur": "thur_slot_id",
    "fri": "fri_slot_id",
}


def _require_faculty_role():
    # NOTE: Intentionally simple and insecure auth by request.
    # TODO: Replace with JWT + RBAC middleware.
    role = request.headers.get("X-Role", "")
    if role != "faculty":
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Only faculty role can access this route",
                    "statusCode": 403,
                }
            ),
            403,
        )
    return None


def _faculty_id_from_request() -> str | None:
    # TODO: Replace this with JWT-based identity extraction.
    faculty_id = request.headers.get("X-Faculty-Id") or request.args.get("facultyId")
    return faculty_id.strip() if faculty_id else None


def _fetch_slots_map(cur, slot_ids: list[int]) -> dict[int, dict]:
    if not slot_ids:
        return {}

    cur.execute(
        """
        SELECT
            s.id,
            s.course_id AS "courseId",
            c.name AS "courseName",
            s.faculty_id AS "facultyId",
            f.name AS "facultyName",
            s.class_id AS "classId",
            cls.division AS "classDivision",
            cls.year AS "classYear"
        FROM slots s
        LEFT JOIN courses c ON c.id = s.course_id
        LEFT JOIN faculty f ON f.id = s.faculty_id
        LEFT JOIN classes cls ON cls.id = s.class_id
        WHERE s.id = ANY(%s)
        """,
        (slot_ids,),
    )
    return {row["id"]: row for row in cur.fetchall()}


@faculty_bp.get("/<college>/faculty/labs")
def get_faculty_labs(college: str):
    guard = _require_faculty_role()
    if guard:
        return guard

    faculty_id = _faculty_id_from_request()
    if not faculty_id:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "facultyId is required",
                    "statusCode": 400,
                }
            ),
            400,
        )

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "College not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            cur.execute(
                """
                SELECT DISTINCT
                    l.id,
                    CAST(l.id AS TEXT) AS "labNo",
                    COALESCE(l.name, CONCAT('Computer Lab ', l.id::TEXT)) AS name,
                    l.floor
                FROM labs l
                JOIN timetable t ON t.lab_id = l.id
                                WHERE l.college_id = %s
                                    AND EXISTS (
                    SELECT 1
                    FROM (
                        VALUES
                            (t.mon_slot_id),
                            (t.tue_slot_id),
                            (t.wed_slot_id),
                            (t.thur_slot_id),
                            (t.fri_slot_id)
                    ) AS day_slots(slot_id)
                    JOIN slots s ON s.id = day_slots.slot_id
                    WHERE s.faculty_id = %s
                )
                ORDER BY l.id
                """,
                (college_row["id"], faculty_id),
            )
            rows = cur.fetchall()

        # TODO: Add query pagination once frontend starts requesting pages.
        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to fetch faculty labs",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()


@faculty_bp.get("/<college>/faculty/labs/<int:lab_id>")
def get_faculty_lab_timetable(college: str, lab_id: int):
    guard = _require_faculty_role()
    if guard:
        return guard

    faculty_id = _faculty_id_from_request()
    if not faculty_id:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "facultyId is required",
                    "statusCode": 400,
                }
            ),
            400,
        )

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "College not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            cur.execute(
                """
                SELECT
                    l.id,
                    CAST(l.id AS TEXT) AS "labNo",
                    COALESCE(l.name, CONCAT('Computer Lab ', l.id::TEXT)) AS name,
                    l.floor,
                    t.mon_slot_id,
                    t.tue_slot_id,
                    t.wed_slot_id,
                    t.thur_slot_id,
                    t.fri_slot_id
                FROM labs l
                LEFT JOIN timetable t ON t.lab_id = l.id
                WHERE l.id = %s AND l.college_id = %s
                """,
                (lab_id, college_row["id"]),
            )
            row = cur.fetchone()

            if not row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Lab not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            slot_ids = [
                row[_DAY_COLUMN_MAP[day]]
                for day in _DAY_KEYS
                if row[_DAY_COLUMN_MAP[day]] is not None
            ]
            slots_map = _fetch_slots_map(cur, slot_ids)

            timetable = {}
            has_assigned_slot = False
            for day in _DAY_KEYS:
                slot_id = row[_DAY_COLUMN_MAP[day]]
                if not slot_id:
                    timetable[day] = None
                    continue

                slot = slots_map.get(slot_id)
                if not slot or str(slot["facultyId"]) != str(faculty_id):
                    timetable[day] = None
                    continue

                timetable[day] = slot
                has_assigned_slot = True

            if not has_assigned_slot:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Faculty has no assigned session in this lab",
                            "statusCode": 403,
                        }
                    ),
                    403,
                )

        return (
            jsonify(
                {
                    "success": True,
                    "data": {
                        "lab": {
                            "id": row["id"],
                            "labNo": row["labNo"],
                            "name": row["name"],
                            "floor": row["floor"],
                        },
                        "timetable": timetable,
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
                    "error": "Failed to fetch faculty lab timetable",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()
