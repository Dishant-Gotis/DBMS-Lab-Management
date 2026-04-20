from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from extensions import get_db, get_next_sequence
from .api_utils import bad_request, get_db_and_college, not_found, require_role, server_error

admin_labs_bp = Blueprint("admin_labs", __name__)


def _require_admin_role():
    return require_role("admin", "Only admins can access these endpoints")


@admin_labs_bp.post("/<college>/admin/labs")
def create_admin_lab(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    floor = payload.get("floor")
    name = payload.get("name")

    if floor is None:
        return bad_request("Missing floor number")

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        lab_id = get_next_sequence("labs")
        row = {"id": lab_id, "college_id": college_row["id"], "floor": floor, "name": name}
        db.labs.insert_one(row)

        return jsonify({"success": True, "data": {**row, "assignedAssistantName": None}, "message": "Lab created successfully"}), 201
    except Exception as exc:
        return server_error("Failed to create lab", exc)


@admin_labs_bp.get("/<college>/admin/labs/<int:lab_id>/pcs")
def get_admin_lab_pcs(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        lab = db.labs.find_one({"id": lab_id, "college_id": college_row["id"]}, {"_id": 0, "id": 1})
        if not lab:
            return not_found("Lab not found")

        pcs_rows = list(
            db.pcs.find({"lab_id": lab_id}, {"_id": 0, "id": 1, "pc_no": 1, "status": 1, "password": 1, "processor": 1, "ram": 1, "storage": 1, "os_id": 1}).sort("id", 1)
        )

        pc_ids = [row["id"] for row in pcs_rows]
        os_ids = list({row.get("os_id") for row in pcs_rows if row.get("os_id") is not None})

        os_rows = list(db.os.find({"id": {"$in": os_ids}}, {"_id": 0, "id": 1, "name": 1, "version": 1})) if os_ids else []
        os_map = {o["id"]: o for o in os_rows}

        softwares = list(
            db.software.find({"pc_id": {"$in": pc_ids}}, {"_id": 0, "id": 1, "name": 1, "version": 1, "pc_id": 1, "installed_at": 1}).sort("installed_at", -1)
        ) if pc_ids else []

        sw_by_pc = {}
        for sw in softwares:
            sw_by_pc.setdefault(sw.get("pc_id"), []).append(
                {
                    "id": sw.get("id"),
                    "name": sw.get("name"),
                    "version": sw.get("version"),
                    "pcId": sw.get("pc_id"),
                    "installedAt": sw.get("installed_at"),
                }
            )

        data = []
        for pc in pcs_rows:
            os_row = os_map.get(pc.get("os_id"))
            data.append(
                {
                    "id": pc.get("id"),
                    "pcNo": pc.get("pc_no"),
                    "status": pc.get("status"),
                    "password": pc.get("password"),
                    "processor": pc.get("processor"),
                    "ram": pc.get("ram"),
                    "storage": pc.get("storage"),
                    "osId": pc.get("os_id"),
                    "osName": os_row.get("name") if os_row else None,
                    "osVersion": os_row.get("version") if os_row else None,
                    "softwares": sw_by_pc.get(pc.get("id"), []),
                }
            )

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return server_error("Failed to fetch lab PCs", exc)


@admin_labs_bp.post("/<college>/admin/labs/<int:lab_id>/pcs")
def create_admin_lab_pc(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    password = payload.get("password")
    pc_no = payload.get("pcNo")
    status = payload.get("status", "active")
    os_id = payload.get("os_id", 1)
    processor = payload.get("processor")
    ram = payload.get("ram")
    storage = payload.get("storage")

    if not password:
        return bad_request("Missing password")

    try:
        db = get_db()
        pc_id = get_next_sequence("pcs")
        row = {
            "id": pc_id,
            "password": password,
            "os_id": int(os_id) if os_id is not None else None,
            "lab_id": lab_id,
            "processor": processor,
            "ram": ram,
            "storage": storage,
            "pc_no": pc_no,
            "status": status,
        }
        db.pcs.insert_one(row)

        return jsonify({"success": True, "data": {"id": pc_id, "pcNo": pc_no, "status": status, "password": password, "osId": row["os_id"], "processor": processor, "ram": ram, "storage": storage, "softwares": []}, "message": "PC added to lab"}), 201
    except Exception as exc:
        return server_error("Failed to create PC", exc)


@admin_labs_bp.post("/<college>/admin/pcs/<int:pc_id>/software")
def install_pc_software(college: str, pc_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    version = payload.get("version")

    if not name:
        return bad_request("Missing software name")

    try:
        db = get_db()
        sw_id = get_next_sequence("software")
        installed_at = datetime.now(timezone.utc).isoformat()
        row = {"id": sw_id, "name": name, "version": version, "pc_id": pc_id, "installed_at": installed_at}
        db.software.insert_one(row)
        return jsonify({"success": True, "data": {"id": sw_id, "name": name, "version": version, "pcId": pc_id, "installedAt": installed_at}, "message": "Software installed"}), 201
    except Exception as exc:
        return server_error("Failed to install software", exc)


@admin_labs_bp.delete("/<college>/admin/labs/<int:lab_id>")
def delete_admin_lab(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db = get_db()
        pc_ids = [pc["id"] for pc in db.pcs.find({"lab_id": lab_id}, {"_id": 0, "id": 1})]
        if pc_ids:
            db.software.delete_many({"pc_id": {"$in": pc_ids}})
        db.pcs.delete_many({"lab_id": lab_id})
        db.timetable.delete_many({"lab_id": lab_id})

        result = db.labs.delete_one({"id": lab_id})
        if result.deleted_count == 0:
            return not_found("Lab not found")

        db.assistants.update_many({"lab_id": lab_id}, {"$set": {"lab_id": None}})
        return jsonify({"success": True, "message": "Lab and all associated computers deleted"}), 200
    except Exception as exc:
        return server_error("Failed to delete lab", exc)


@admin_labs_bp.delete("/<college>/admin/labs/<int:lab_id>/pcs/<int:pc_id>")
def delete_admin_lab_pc(college: str, lab_id: int, pc_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db = get_db()
        db.software.delete_many({"pc_id": pc_id})
        result = db.pcs.delete_one({"id": pc_id, "lab_id": lab_id})
        if result.deleted_count == 0:
            return not_found("PC not found in this lab")
        return jsonify({"success": True, "message": "PC deleted"}), 200
    except Exception as exc:
        return server_error("Failed to delete PC", exc)


@admin_labs_bp.delete("/<college>/admin/software/<int:sw_id>")
def delete_admin_software(college: str, sw_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db = get_db()
        result = db.software.delete_one({"id": sw_id})
        if result.deleted_count == 0:
            return not_found("Software not found")
        return jsonify({"success": True, "message": "Software deleted"}), 200
    except Exception as exc:
        return server_error("Failed to delete software", exc)
