from flask import Blueprint, request, jsonify
from pymongo import ReturnDocument

from extensions import get_db, get_next_sequence
from .api_utils import bad_request, conflict, get_db_and_college, not_found, require_role, server_error

admin_assistants_bp = Blueprint("admin_assistants", __name__)


def _require_admin_role():
    return require_role("admin", "Unauthorized")


@admin_assistants_bp.get("/<college>/admin/assistants")
def get_assistants(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        labs = list(db.labs.find({"college_id": college_row["id"]}, {"_id": 0, "id": 1, "floor": 1}))
        lab_ids = [lab["id"] for lab in labs]
        floor_map = {lab["id"]: lab.get("floor") for lab in labs}

        rows = list(
            db.assistants.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1, "password": 1, "lab_id": 1}).sort("name", 1)
        ) if lab_ids else []

        data = []
        for row in rows:
            data.append(
                {
                    "id": row.get("id"),
                    "name": row.get("name"),
                    "email": row.get("email"),
                    "phone": row.get("phone"),
                    "password": row.get("password"),
                    "assignedLabNo": floor_map.get(row.get("lab_id")),
                }
            )

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return server_error("Failed to fetch assistants", exc)


@admin_assistants_bp.post("/<college>/admin/assistants")
def create_assistant(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    email = (payload.get("email") or "").strip().lower()
    phone = payload.get("phone", "000-000-0000")
    password = payload.get("password")
    lab_id = payload.get("labId")

    if not name or not email or not password:
        return bad_request("Missing required fields (name, email, password)")

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        if db.assistants.find_one({"$or": [{"email": email}, {"phone": phone}]}, {"_id": 1}):
            return conflict("An assistant with this email or phone already exists")

        if not lab_id:
            default_lab = db.labs.find_one({"college_id": college_row["id"]}, {"_id": 0, "id": 1}, sort=[("id", 1)])
            if not default_lab:
                return bad_request("Cannot create assistant: create a lab first.")
            lab_id = default_lab["id"]
        else:
            if not db.labs.find_one({"id": int(lab_id), "college_id": college_row["id"]}, {"_id": 1}):
                return not_found("Lab not found")
            lab_id = int(lab_id)

        assistant_id = get_next_sequence("assistants")
        row = {"id": assistant_id, "name": name, "email": email, "phone": phone, "password": password, "lab_id": lab_id}
        db.assistants.insert_one(row)

        return jsonify({"success": True, "data": {"id": assistant_id, "name": name, "email": email, "phone": phone, "password": password, "labId": lab_id}}), 201
    except Exception as exc:
        return server_error("Failed to create assistant", exc)


@admin_assistants_bp.delete("/<college>/admin/assistants/<int:assistant_id>")
def delete_assistant(college: str, assistant_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db = get_db()
        result = db.assistants.delete_one({"id": assistant_id})
        if result.deleted_count == 0:
            return not_found("Assistant not found")
        return jsonify({"success": True, "message": "Assistant deleted"}), 200
    except Exception as exc:
        return server_error("Failed to delete assistant", exc)


@admin_assistants_bp.put("/<college>/admin/assistants/<int:assistant_id>/assign")
def assign_assistant_lab(college: str, assistant_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    lab_id = payload.get("labId")

    if not lab_id:
        return bad_request("Missing labId")

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        lab = db.labs.find_one({"id": int(lab_id), "college_id": college_row["id"]}, {"_id": 0, "id": 1})
        if not lab:
            return not_found("Lab not found")

        result = db.assistants.find_one_and_update(
            {"id": assistant_id},
            {"$set": {"lab_id": int(lab_id)}},
            projection={"_id": 0, "id": 1, "name": 1, "lab_id": 1},
            return_document=ReturnDocument.AFTER,
        )
        if not result:
            return not_found("Assistant not found")

        return jsonify({"success": True, "data": {"id": result["id"], "name": result["name"], "labId": result.get("lab_id")}}), 200
    except Exception as exc:
        return server_error("Failed to assign lab to assistant", exc)
