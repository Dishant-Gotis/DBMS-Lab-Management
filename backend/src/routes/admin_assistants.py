from flask import Blueprint, request, jsonify
from extensions import get_db_connection, get_dict_cursor

admin_assistants_bp = Blueprint("admin_assistants", __name__)

def _require_admin_role():
    role = request.headers.get("X-Role", "").lower()
    if role != "admin":
        return jsonify({"success": False, "error": "Unauthorized", "statusCode": 403}), 403
    return None

@admin_assistants_bp.get("/<college>/admin/assistants")
def get_assistants(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("""
                SELECT
                    a.id,
                    a.name,
                    a.email,
                    a.phone,
                    a.password,
                    l.floor AS "assignedLabNo"
                FROM assistants a
                LEFT JOIN labs l ON a.lab_id = l.id
                ORDER BY a.name ASC
            """)
            rows = cur.fetchall()

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch assistants", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()

@admin_assistants_bp.post("/<college>/admin/assistants")
def create_assistant(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    email = payload.get("email")
    phone = payload.get("phone", "000-000-0000") # Required by schema
    password = payload.get("password")


    lab_id = payload.get("labId")

    if not name or not email or not password:
        return jsonify({"success": False, "error": "Missing required fields (name, email, password)", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            if not lab_id:
                cur.execute("SELECT id FROM labs LIMIT 1")
                lab_row = cur.fetchone()
                if not lab_row:
                    return jsonify({"success": False, "error": "Cannot create assistant: No labs exist in the database to satisfy lab_id constraint. Please create a lab first.", "statusCode": 400}), 400
                lab_id = lab_row["id"]

            cur.execute("""
                INSERT INTO assistants (name, email, phone, password, lab_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, email, phone, password, lab_id AS "labId"
            """, (name, email, phone, password, lab_id))
            row = cur.fetchone()

        conn.commit()
        return jsonify({"success": True, "data": row}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        if "unique constraint" in str(exc).lower():
             return jsonify({"success": False, "error": "An assistant with this email or phone already exists", "statusCode": 409}), 409
        return jsonify({"success": False, "error": "Failed to create assistant", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()

@admin_assistants_bp.delete("/<college>/admin/assistants/<int:assistant_id>")
def delete_assistant(college: str, assistant_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("DELETE FROM assistants WHERE id = %s RETURNING id", (assistant_id,))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Assistant not found", "statusCode": 404}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Assistant deleted"}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to delete assistant", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()

@admin_assistants_bp.put("/<college>/admin/assistants/<int:assistant_id>/assign")
def assign_assistant_lab(college: str, assistant_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    lab_id = payload.get("labId")

    if not lab_id:
        return jsonify({"success": False, "error": "Missing labId", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("SELECT id FROM labs WHERE id = %s", (lab_id,))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404

            cur.execute("""
                UPDATE assistants
                SET lab_id = %s
                WHERE id = %s
                RETURNING id, name, lab_id AS "labId"
            """, (lab_id, assistant_id))

            row = cur.fetchone()
            if not row:
                return jsonify({"success": False, "error": "Assistant not found", "statusCode": 404}), 404

        conn.commit()
        return jsonify({"success": True, "data": row}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to assign lab to assistant", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()
