import os

from flask import Blueprint, jsonify, request

from extensions import get_db_connection, get_dict_cursor


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    role = (payload.get("role") or "").strip()

    if not email or not password or not role:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "email, password and role are required",
                    "statusCode": 400,
                }
            ),
            400,
        )

    if role == "admin":
        admin_email = os.getenv("ADMIN_EMAIL", "admin@pccoepune.org").lower()
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        if email == admin_email and password == admin_password:
            return (
                jsonify(
                    {
                        "success": True,
                        "data": {
                            "id": "admin-001",
                            "name": "Admin",
                            "email": admin_email,
                            "role": "admin",
                            "assignedLabs": [],
                        },
                    }
                ),
                200,
            )
        return jsonify({"success": False, "error": "Invalid credentials", "statusCode": 401}), 401

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            if role == "faculty":
                cur.execute(
                    """
                    SELECT id, name, email
                    FROM faculty
                    WHERE lower(email) = %s AND password = %s
                    LIMIT 1
                    """,
                    (email, password),
                )
                row = cur.fetchone()
                if not row:
                    return jsonify({"success": False, "error": "Invalid credentials", "statusCode": 401}), 401

                return (
                    jsonify(
                        {
                            "success": True,
                            "data": {
                                "id": str(row["id"]),
                                "name": row["name"],
                                "email": row["email"],
                                "role": "faculty",
                                "assignedLabs": [],
                            },
                        }
                    ),
                    200,
                )

            if role in ("assistant", "labAssistant"):
                cur.execute(
                    """
                    SELECT
                        a.id,
                        a.name,
                        a.email,
                        a.lab_id,
                        l.id AS lab_no
                    FROM assistants a
                    LEFT JOIN labs l ON l.id = a.lab_id
                    WHERE lower(a.email) = %s AND a.password = %s
                    LIMIT 1
                    """,
                    (email, password),
                )
                row = cur.fetchone()
                if not row:
                    return jsonify({"success": False, "error": "Invalid credentials", "statusCode": 401}), 401

                assigned_labs = [str(row["lab_no"])] if row.get("lab_no") else []
                return (
                    jsonify(
                        {
                            "success": True,
                            "data": {
                                "id": str(row["id"]),
                                "name": row["name"],
                                "email": row["email"],
                                "role": "labAssistant",
                                "assignedLabs": assigned_labs,
                            },
                        }
                    ),
                    200,
                )

            return jsonify({"success": False, "error": "Unsupported role", "statusCode": 400}), 400
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Login failed",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()
