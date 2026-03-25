from flask import Blueprint, jsonify, request

from extensions import get_db_connection, get_dict_cursor
from .common import resolve_college


admin_timetable_bp = Blueprint("admin_timetable", __name__)

_DAY_TO_COLUMN = {
    "mon": "mon_slot_id",
    "tue": "tue_slot_id",
    "wed": "wed_slot_id",
    "thur": "thur_slot_id",
    "fri": "fri_slot_id",
}


def _require_admin_role():
    role = request.headers.get("X-Role", "")
    if role != "admin":
        return jsonify({"success": False, "error": "Only admins can access these endpoints", "statusCode": 403}), 403
    return None


@admin_timetable_bp.get("/<college>/admin/timetable/meta")
def get_admin_timetable_meta(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT id, id AS "labNo", name, floor
                FROM labs
                WHERE college_id = %s
                ORDER BY id
                """,
                (college_row["id"],),
            )
            labs = cur.fetchall()
            for row in labs:
                row["labNo"] = str(row["labNo"])
                row["name"] = row["name"] or f"Computer Lab {row['id']}"

            cur.execute(
                """
                SELECT id, division, year
                FROM classes
                ORDER BY id
                """
            )
            classes = [
                {
                    "id": str(row["id"]),
                    "name": f"{row['division']} (Year {row['year']})",
                }
                for row in cur.fetchall()
            ]

            cur.execute("SELECT id, name FROM courses ORDER BY id")
            courses = [{"id": str(row["id"]), "name": row["name"]} for row in cur.fetchall()]

            cur.execute("SELECT id, name FROM faculty ORDER BY id")
            faculty = [{"id": str(row["id"]), "name": row["name"]} for row in cur.fetchall()]

        return jsonify({"success": True, "data": {"labs": labs, "classes": classes, "courses": courses, "faculty": faculty}}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch timetable meta", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_timetable_bp.post("/<college>/admin/timetable/slots")
def create_admin_slot(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    course_id = payload.get("course_id")
    faculty_id = payload.get("faculty_id")
    class_id = payload.get("class_id")

    if not all([course_id, faculty_id, class_id]):
        return jsonify({"success": False, "error": "course_id, faculty_id and class_id are required", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                INSERT INTO slots (course_id, faculty_id, class_id)
                VALUES (%s, %s, %s)
                RETURNING id, course_id, faculty_id, class_id
                """,
                (course_id, faculty_id, class_id),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Slot created"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create slot", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_timetable_bp.put("/<college>/admin/timetable/<int:lab_id>")
def update_admin_timetable_day(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    day = (payload.get("day") or "").strip().lower()
    slot_id = payload.get("slot_id")

    if day not in _DAY_TO_COLUMN:
        return jsonify({"success": False, "error": "day must be one of: mon, tue, wed, thur, fri", "statusCode": 400}), 400

    column = _DAY_TO_COLUMN[day]

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute("SELECT id FROM labs WHERE id = %s AND college_id = %s", (lab_id, college_row["id"]))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404

            cur.execute(
                """
                INSERT INTO timetable (lab_id)
                VALUES (%s)
                ON CONFLICT (lab_id) DO NOTHING
                """,
                (lab_id,),
            )

            cur.execute(
                f"""
                UPDATE timetable
                SET {column} = %s
                WHERE lab_id = %s
                RETURNING lab_id, mon_slot_id, tue_slot_id, wed_slot_id, thur_slot_id, fri_slot_id
                """,
                (slot_id, lab_id),
            )
            row = cur.fetchone()

        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Timetable updated"}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to update timetable", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()
