from flask import Blueprint, jsonify, request
from extensions import get_db_connection, get_dict_cursor
from .common import resolve_college

admin_labs_bp = Blueprint("admin_labs", __name__)

def _require_admin_role():
    role = request.headers.get("X-Role", "")
    if role != "admin":
        return jsonify({"success": False, "error": "Only admins can access these endpoints", "statusCode": 403}), 403
    return None

@admin_labs_bp.post("/<college>/admin/labs")
def create_admin_lab(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    floor = payload.get("floor")
    name = payload.get("name")

    if floor is None:
        return jsonify({"success": False, "error": "Missing floor number", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                INSERT INTO labs (college_id, floor, name)
                VALUES (%s, %s, %s)
                RETURNING id, college_id, floor, name
                """,
                (college_row["id"], floor, name)
            )
            row = cur.fetchone()

            row["assignedAssistantName"] = None

        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Lab created successfully"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create lab", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()

@admin_labs_bp.get("/<college>/admin/labs/<int:lab_id>/pcs")
def get_admin_lab_pcs(college: str, lab_id: int):
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

            cur.execute("SELECT id FROM labs WHERE id = %s AND college_id = %s", (lab_id, college_row["id"]))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT
                    p.id,
                    p.pc_no AS "pcNo",
                    p.status,
                    p.password,
                    p.processor,
                    p.ram,
                    p.storage,
                    p.os_id AS "osId",
                    o.name AS "osName",
                    o.version AS "osVersion"
                FROM pcs p
                LEFT JOIN os o ON o.id = p.os_id
                WHERE p.lab_id = %s
                ORDER BY p.id
                """,
                (lab_id,),
            )
            pcs_rows = cur.fetchall()

            pcs_dict = {row["id"]: row for row in pcs_rows}

            if pcs_rows:
                pc_ids = tuple(row["id"] for row in pcs_rows)
                cur.execute(
                    """
                    SELECT id, name, version, pc_id as "pcId", installed_at AS "installedAt"
                    FROM software
                    WHERE pc_id IN %s
                    ORDER BY installed_at DESC
                    """,
                    (pc_ids,),
                )
                softwares = cur.fetchall()

                for pc in pcs_dict.values():
                    pc["softwares"] = []
                for sw in softwares:
                    pcs_dict[sw["pcId"]]["softwares"].append(sw)
            else:
                softwares = []

        return jsonify({"success": True, "data": list(pcs_dict.values())}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch lab PCs", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()

@admin_labs_bp.post("/<college>/admin/labs/<int:lab_id>/pcs")
def create_admin_lab_pc(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    password = payload.get("password")
    pc_no = payload.get("pcNo")
    status = payload.get("status", "active")
    os_id = payload.get("os_id", 1)  # Default to some OS if not provided
    processor = payload.get("processor")
    ram = payload.get("ram")
    storage = payload.get("storage")

    if not password:
        return jsonify({"success": False, "error": "Missing password", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO pcs (password, os_id, lab_id, processor, ram, storage, pc_no, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, pc_no AS "pcNo", status, password, os_id AS "osId", processor, ram, storage
                """,
                (password, os_id, lab_id, processor, ram, storage, pc_no, status),
            )
            row = cur.fetchone()
        conn.commit()

        row["softwares"] = [] # Return empty array for convenience
        return jsonify({"success": True, "data": row, "message": "PC added to lab"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create PC", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()

@admin_labs_bp.post("/<college>/admin/pcs/<int:pc_id>/software")
def install_pc_software(college: str, pc_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    version = payload.get("version")

    if not name:
        return jsonify({"success": False, "error": "Missing software name", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO software (name, version, pc_id)
                VALUES (%s, %s, %s)
                RETURNING id, name, version, pc_id AS "pcId", installed_at AS "installedAt"
                """,
                (name, version, pc_id),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Software installed"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to install software", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_labs_bp.delete("/<college>/admin/labs/<int:lab_id>")
def delete_admin_lab(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("DELETE FROM software WHERE pc_id IN (SELECT id FROM pcs WHERE lab_id = %s)", (lab_id,))
            cur.execute("DELETE FROM pcs WHERE lab_id = %s", (lab_id,))
            cur.execute("DELETE FROM labs WHERE id = %s RETURNING id", (lab_id,))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Lab and all associated computers deleted"}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to delete lab", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_labs_bp.delete("/<college>/admin/labs/<int:lab_id>/pcs/<int:pc_id>")
def delete_admin_lab_pc(college: str, lab_id: int, pc_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("DELETE FROM software WHERE pc_id = %s", (pc_id,))
            cur.execute("DELETE FROM pcs WHERE id = %s AND lab_id = %s RETURNING id", (pc_id, lab_id))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "PC not found in this lab", "statusCode": 404}), 404
        conn.commit()
        return jsonify({"success": True, "message": "PC deleted"}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to delete PC", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@admin_labs_bp.delete("/<college>/admin/software/<int:sw_id>")
def delete_admin_software(college: str, sw_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("DELETE FROM software WHERE id = %s RETURNING id", (sw_id,))
            if not cur.fetchone():
                return jsonify({"success": False, "error": "Software not found", "statusCode": 404}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Software deleted"}), 200
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to delete software", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()
