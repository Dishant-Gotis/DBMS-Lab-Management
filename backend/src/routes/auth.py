import os

from flask import Blueprint, jsonify, request

from extensions import get_db


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

    try:
        db = get_db()

        if role == "faculty":
            row = db.faculty.find_one(
                {"email": email, "password": password},
                {"_id": 0, "id": 1, "name": 1, "email": 1},
            )
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
            row = db.assistants.find_one(
                {"email": email, "password": password},
                {"_id": 0, "id": 1, "name": 1, "email": 1, "lab_id": 1},
            )
            if not row:
                return jsonify({"success": False, "error": "Invalid credentials", "statusCode": 401}), 401

            assigned_labs = [str(row["lab_id"])] if row.get("lab_id") else []
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
