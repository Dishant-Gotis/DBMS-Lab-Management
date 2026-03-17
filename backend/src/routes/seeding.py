import os

from flask import Blueprint, jsonify, request

from extensions import get_db_connection, get_dict_cursor

# NOTE: Temporary seeding endpoints.
# TODO: Move logic into permanent service/controller layers when integration is finalized.
seeding_bp = Blueprint("seeding", __name__)


def _require_seed_admin():
    # NOTE: Intentionally simple and insecure auth by request.
    # TODO: Replace with JWT + RBAC middleware.
    role = request.headers.get("X-Role", "")
    key = request.headers.get("X-Seed-Key", "")
    expected = os.getenv("SEED_ADMIN_KEY", "seed-dev-key")

    if role != "admin":
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Only admin can access seeding routes",
                    "statusCode": 403,
                }
            ),
            403,
        )

    if key != expected:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Invalid seed key",
                    "statusCode": 403,
                }
            ),
            403,
        )

    return None


def _missing(*fields):
    payload = request.get_json(silent=True) or {}
    missing = [field for field in fields if payload.get(field) is None]
    return payload, missing


@seeding_bp.get("/seed/ping-db")
def ping_db():
    guard = _require_seed_admin()
    if guard:
        return guard

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("SELECT 1 AS ok")
            row = cur.fetchone()
        return jsonify({"success": True, "data": row}), 200
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Database connection failed",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/colleges")
def create_college_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("name", "city", "pincode", "state")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO colleges (name, city, pincode, state)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, city, pincode, state
                """,
                (payload["name"], payload["city"], payload["pincode"], payload["state"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "College created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create college", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/labs")
def create_lab_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("college_id", "floor")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO labs (college_id, name, floor)
                VALUES (%s, %s, %s)
                RETURNING id, college_id, name, floor
                """,
                (payload["college_id"], payload.get("name"), payload["floor"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Lab created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create lab", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/os")
def create_os_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("name", "version")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO os (name, version)
                VALUES (%s, %s)
                RETURNING id, name, version
                """,
                (payload["name"], payload["version"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "OS created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create OS", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/pcs")
def create_pc_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("password", "os_id", "lab_id")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO pcs (password, os_id, lab_id)
                VALUES (%s, %s, %s)
                RETURNING id, password, os_id, lab_id
                """,
                (payload["password"], payload["os_id"], payload["lab_id"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "PC created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create PC", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/assistants")
def create_assistant_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("name", "password", "email", "phone", "lab_id")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO assistants (name, password, email, phone, lab_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, email, phone, lab_id
                """,
                (payload["name"], payload["password"], payload["email"], payload["phone"], payload["lab_id"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Assistant created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create assistant", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/software")
def create_software_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("name", "pc_id")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO software (name, version, pc_id)
                VALUES (%s, %s, %s)
                RETURNING id, name, version, pc_id, installed_at
                """,
                (payload["name"], payload.get("version"), payload["pc_id"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Software created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create software", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/classes")
def create_class_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("division", "year", "floor", "strength")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO classes (division, year, floor, strength)
                VALUES (%s, %s, %s, %s)
                RETURNING id, division, year, floor, strength
                """,
                (payload["division"], payload["year"], payload["floor"], payload["strength"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Class created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create class", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/faculty")
def create_faculty_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("name", "password", "email", "phone")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO faculty (name, password, email, phone)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, email, phone
                """,
                (payload["name"], payload["password"], payload["email"], payload["phone"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Faculty created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create faculty", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/courses")
def create_course_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("name", "duration_weeks", "credits")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO courses (name, duration_weeks, credits)
                VALUES (%s, %s, %s)
                RETURNING id, name, duration_weeks, credits
                """,
                (payload["name"], payload["duration_weeks"], payload["credits"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Course created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create course", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/slots")
def create_slot_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("course_id", "faculty_id", "class_id")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO slots (course_id, faculty_id, class_id)
                VALUES (%s, %s, %s)
                RETURNING id, course_id, faculty_id, class_id
                """,
                (payload["course_id"], payload["faculty_id"], payload["class_id"]),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Slot created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create slot", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@seeding_bp.post("/seed/timetable")
def create_timetable_seed():
    guard = _require_seed_admin()
    if guard:
        return guard

    payload, missing = _missing("lab_id")
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}", "statusCode": 400}), 400

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO timetable (lab_id, mon_slot_id, tue_slot_id, wed_slot_id, thur_slot_id, fri_slot_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING lab_id, mon_slot_id, tue_slot_id, wed_slot_id, thur_slot_id, fri_slot_id
                """,
                (
                    payload["lab_id"],
                    payload.get("mon_slot_id"),
                    payload.get("tue_slot_id"),
                    payload.get("wed_slot_id"),
                    payload.get("thur_slot_id"),
                    payload.get("fri_slot_id"),
                ),
            )
            row = cur.fetchone()
        conn.commit()
        return jsonify({"success": True, "data": row, "message": "Timetable created (seed)"}), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "error": "Failed to create timetable", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()