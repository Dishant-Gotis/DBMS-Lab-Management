from flask import jsonify, request

from extensions import get_db
from .common import resolve_college


def require_role(role: str, message: str):
    if request.headers.get("X-Role", "").lower() != role.lower():
        return jsonify({"success": False, "error": message, "statusCode": 403}), 403
    return None


def bad_request(message: str):
    return jsonify({"success": False, "error": message, "statusCode": 400}), 400


def not_found(message: str):
    return jsonify({"success": False, "error": message, "statusCode": 404}), 404


def conflict(message: str):
    return jsonify({"success": False, "error": message, "statusCode": 409}), 409


def server_error(message: str, exc: Exception):
    return jsonify({"success": False, "error": message, "statusCode": 500, "details": str(exc)}), 500


def get_db_and_college(college: str):
    db = get_db()
    college_row = resolve_college(db, college)
    if not college_row:
        return db, None, not_found("College not found")
    return db, college_row, None