from flask import Blueprint, jsonify, request

from extensions import get_db_connection, get_dict_cursor
from .common import resolve_college

assistant_bp = Blueprint("assistant", __name__)

_DAY_KEYS = ["mon", "tue", "wed", "thur", "fri"]
_DAY_COLUMN_MAP = {
    "mon": "mon_slot_id",
    "tue": "tue_slot_id",
    "wed": "wed_slot_id",
    "thur": "thur_slot_id",
    "fri": "fri_slot_id",
}


def _require_assistant_role():
    # NOTE: Intentionally simple and insecure auth by request.
    # TODO: Replace with JWT + RBAC middleware.
    role = request.headers.get("X-Role", "")
    if role != "assistant":
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Only assistant role can access this route",
                    "statusCode": 403,
                }
            ),
            403,
        )
    return None


def _assistant_id_from_request() -> str | None:
    # TODO: Replace this with JWT-based identity extraction.
    assistant_id = request.headers.get("X-Assistant-Id") or request.args.get("assistantId")
    return assistant_id.strip() if assistant_id else None


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


@assistant_bp.get("/<college>/assistant/labs")
def get_assistant_labs(college: str):
    guard = _require_assistant_role()
    if guard:
        return guard

    assistant_id = _assistant_id_from_request()
    if not assistant_id:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "assistantId is required",
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
                    a.id AS "assignedAssistantId",
                    a.name AS "assignedAssistantName"
                FROM assistants a
                JOIN labs l ON l.id = a.lab_id
                WHERE a.id = %s AND l.college_id = %s
                """,
                (assistant_id, college_row["id"]),
            )
            rows = cur.fetchall()

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to fetch assistant labs",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()


@assistant_bp.get("/<college>/assistant/labs/<int:lab_id>")
def get_assistant_lab_timetable(college: str, lab_id: int):
    guard = _require_assistant_role()
    if guard:
        return guard

    assistant_id = _assistant_id_from_request()
    if not assistant_id:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "assistantId is required",
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
                SELECT 1
                FROM assistants a
                JOIN labs l ON l.id = a.lab_id
                WHERE a.id = %s AND a.lab_id = %s AND l.college_id = %s
                """,
                (assistant_id, lab_id, college_row["id"]),
            )
            assigned = cur.fetchone()
            if not assigned:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Assistant is not assigned to this lab",
                            "statusCode": 403,
                        }
                    ),
                    403,
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
            for day in _DAY_KEYS:
                slot_id = row[_DAY_COLUMN_MAP[day]]
                timetable[day] = slots_map.get(slot_id) if slot_id else None

        # TODO: Add attendance/usage summary once event logs table is available.
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
                    "error": "Failed to fetch assistant lab timetable",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()
