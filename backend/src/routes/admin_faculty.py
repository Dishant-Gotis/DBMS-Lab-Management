from flask import Blueprint, request, jsonify

from extensions import get_db, get_next_sequence
from .api_utils import bad_request, conflict, require_role, server_error

admin_faculty_bp = Blueprint("admin_faculty", __name__)


def _require_admin_role():
    return require_role("admin", "Unauthorized")


@admin_faculty_bp.get("/<college>/admin/faculty")
def get_faculty(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db = get_db()
        rows = list(db.faculty.find({}, {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1}).sort("name", 1))
        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch faculty", "statusCode": 500, "details": str(exc)}), 500


@admin_faculty_bp.post("/<college>/admin/faculty")
def create_faculty(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    email = (payload.get("email") or "").strip().lower()
    phone = payload.get("phone", "000-000-0000")
    password = payload.get("password")

    if not name or not email or not password:
        return bad_request("Missing required fields (name, email, password)")

    try:
        db = get_db()
        if db.faculty.find_one({"$or": [{"email": email}, {"phone": phone}]}, {"_id": 1}):
            return conflict("A faculty member with this email or phone already exists")

        faculty_id = get_next_sequence("faculty")
        row = {"id": faculty_id, "name": name, "email": email, "phone": phone, "password": password}
        db.faculty.insert_one(row)
        return jsonify({"success": True, "data": {"id": faculty_id, "name": name, "email": email, "phone": phone}}), 201
    except Exception as exc:
        return server_error("Failed to create faculty", exc)


@admin_faculty_bp.delete("/<college>/admin/faculty/<int:faculty_id>")
def delete_faculty(college: str, faculty_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db = get_db()
        result = db.faculty.delete_one({"id": faculty_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "error": "Faculty not found", "statusCode": 404}), 404
        return jsonify({"success": True, "message": "Faculty deleted"}), 200
    except Exception as exc:
        return server_error("Failed to delete faculty", exc)
