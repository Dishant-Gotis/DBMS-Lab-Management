from flask import Blueprint, request, jsonify
from extensions import get_db_connection, get_dict_cursor

admin_faculty_bp = Blueprint("admin_faculty", __name__)


def _require_admin_role():
    role = request.headers.get("X-Role", "").lower()
    if role != "admin":
        return jsonify({"success": False, "error": "Unauthorized", "statusCode": 403}), 403
    return None


@admin_faculty_bp.get("/<college>/admin/faculty")
def get_faculty(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("""
                SELECT id, name, email, phone
                FROM faculty
                ORDER BY name ASC
            """)
            rows = cur.fetchall()
        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch faculty", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_faculty_bp.post("/<college>/admin/faculty")
def create_faculty(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    email = payload.get("email")
    phone = payload.get("phone", "000-000-0000")
    password = payload.get("password")

    if not name or not email or not password:
        return jsonify({"success": False, "error": "Missing required fields (name, email, password)", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("""
                INSERT INTO faculty (name, email, phone, password)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, email, phone
            """, (name, email, phone, password))
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        if "unique constraint" in str(exc).lower():
            return jsonify({"success": False, "error": "A faculty member with this email or phone already exists", "statusCode": 409}), 409
        return jsonify({"success": False, "error": "Failed to create faculty", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_faculty_bp.delete("/<college>/admin/faculty/<int:faculty_id>")
def delete_faculty(college: str, faculty_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("DELETE FROM faculty WHERE id = %s RETURNING id", (faculty_id,))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Faculty not found", "statusCode": 404}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Faculty deleted"}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to delete faculty", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()
