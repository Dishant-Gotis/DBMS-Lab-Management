import re

from flask import Blueprint, jsonify, request

from extensions import get_db
from .common import resolve_college

labs_bp = Blueprint("labs", __name__)


@labs_bp.get("/<college>/labs")
def get_labs(college: str):
    q = request.args.get("q", "").strip()

    try:
        page = max(int(request.args.get("page", 1)), 1)
    except ValueError:
        page = 1

    try:
        page_size = max(int(request.args.get("pageSize", 50)), 1)
    except ValueError:
        page_size = 50

    offset = (page - 1) * page_size

    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        base_filter = {"college_id": college_row["id"]}
        if q:
            if q.isdigit():
                base_filter["$or"] = [{"id": int(q)}, {"name": {"$regex": re.escape(q), "$options": "i"}}]
            else:
                base_filter["name"] = {"$regex": re.escape(q), "$options": "i"}

        total = db.labs.count_documents(base_filter)
        rows = list(
            db.labs.find(base_filter, {"_id": 0, "id": 1, "name": 1, "floor": 1})
            .sort("id", 1)
            .skip(offset)
            .limit(page_size)
        )

        lab_ids = [row["id"] for row in rows]
        assistants = list(
            db.assistants.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "id": 1, "name": 1, "lab_id": 1}).sort("id", 1)
        ) if lab_ids else []
        assistant_map = {}
        for assistant in assistants:
            assistant_map.setdefault(assistant.get("lab_id"), assistant)

        data = []
        for row in rows:
            assistant = assistant_map.get(row["id"])
            data.append(
                {
                    "id": row["id"],
                    "labNo": str(row["id"]),
                    "name": row.get("name") or f"Computer Lab {row['id']}",
                    "floor": row.get("floor"),
                    "assignedAssistantId": assistant.get("id") if assistant else None,
                    "assignedAssistantName": assistant.get("name") if assistant else None,
                }
            )

        return jsonify({"success": True, "data": data, "total": total, "page": page, "pageSize": page_size}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch labs", "statusCode": 500, "details": str(exc)}), 500


@labs_bp.get("/<college>/labs/lab/<int:lab_id>")
def get_lab_by_id(college: str, lab_id: int):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        row = db.labs.find_one({"id": lab_id, "college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1})
        if not row:
            return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404

        assistant = db.assistants.find_one({"lab_id": lab_id}, {"_id": 0, "id": 1, "name": 1})
        data = {
            "id": row["id"],
            "labNo": str(row["id"]),
            "name": row.get("name") or f"Computer Lab {row['id']}",
            "floor": row.get("floor"),
            "assignedAssistantId": assistant.get("id") if assistant else None,
            "assignedAssistantName": assistant.get("name") if assistant else None,
        }

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch lab", "statusCode": 500, "details": str(exc)}), 500


@labs_bp.get("/<college>/labs/<int:pc_id>")
def get_pc_software_details(college: str, pc_id: int):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        pc_row = db.pcs.find_one({"id": pc_id}, {"_id": 0, "id": 1, "password": 1, "os_id": 1, "lab_id": 1})
        if not pc_row:
            return jsonify({"success": False, "error": "PC not found", "statusCode": 404}), 404

        lab_row = db.labs.find_one({"id": pc_row.get("lab_id"), "college_id": college_row["id"]}, {"_id": 0, "id": 1})
        if not lab_row:
            return jsonify({"success": False, "error": "PC not found", "statusCode": 404}), 404

        os_row = db.os.find_one({"id": pc_row.get("os_id")}, {"_id": 0, "id": 1, "name": 1, "version": 1})
        softwares = list(
            db.software.find({"pc_id": pc_id}, {"_id": 0, "id": 1, "name": 1, "version": 1, "installed_at": 1}).sort("installed_at", -1)
        )

        for sw in softwares:
            sw["installedAt"] = sw.pop("installed_at", None)

        return (
            jsonify(
                {
                    "success": True,
                    "data": {
                        "college": {"id": college_row["id"], "name": college_row["name"]},
                        "pc": {
                            "id": pc_row["id"],
                            "password": pc_row.get("password"),
                            "osId": pc_row.get("os_id"),
                            "osName": os_row.get("name") if os_row else None,
                            "osVersion": os_row.get("version") if os_row else None,
                            "specDescription": None,
                        },
                        "softwares": softwares,
                    },
                }
            ),
            200,
        )
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch PC software details", "statusCode": 500, "details": str(exc)}), 500
