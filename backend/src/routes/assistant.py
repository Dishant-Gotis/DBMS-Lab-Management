from flask import Blueprint, jsonify, request

from extensions import get_db
from .common import resolve_college

assistant_bp = Blueprint("assistant", __name__)

_DAY_KEYS = ["mon", "tue", "wed", "thur", "fri"]
_DAY_FIELD_MAP = {
    "mon": "mon_slot_id",
    "tue": "tue_slot_id",
    "wed": "wed_slot_id",
    "thur": "thur_slot_id",
    "fri": "fri_slot_id",
}


def _require_assistant_role():
    role = request.headers.get("X-Role", "")
    if role != "assistant":
        return jsonify({"success": False, "error": "Only assistant role can access this route", "statusCode": 403}), 403
    return None


def _assistant_id_from_request() -> str | None:
    assistant_id = request.headers.get("X-Assistant-Id") or request.args.get("assistantId")
    if not assistant_id:
        return None
    assistant_id = assistant_id.strip()
    if assistant_id.startswith("user-"):
        assistant_id = assistant_id.replace("user-", "")
    return assistant_id


def _fetch_slots_map(db, slot_ids: list[int]) -> dict[int, dict]:
    if not slot_ids:
        return {}

    rows = list(db.slots.find({"id": {"$in": slot_ids}}, {"_id": 0, "id": 1, "course_id": 1, "faculty_id": 1, "class_id": 1}))
    if not rows:
        return {}

    course_ids = list({row.get("course_id") for row in rows if row.get("course_id") is not None})
    faculty_ids = list({row.get("faculty_id") for row in rows if row.get("faculty_id") is not None})
    class_ids = list({row.get("class_id") for row in rows if row.get("class_id") is not None})

    courses = {
        row["id"]: row
        for row in db.courses.find({"id": {"$in": course_ids}}, {"_id": 0, "id": 1, "name": 1})
    } if course_ids else {}
    faculty = {
        row["id"]: row
        for row in db.faculty.find({"id": {"$in": faculty_ids}}, {"_id": 0, "id": 1, "name": 1})
    } if faculty_ids else {}
    classes = {
        row["id"]: row
        for row in db.classes.find({"id": {"$in": class_ids}}, {"_id": 0, "id": 1, "division": 1, "year": 1})
    } if class_ids else {}

    out = {}
    for row in rows:
        class_row = classes.get(row.get("class_id"), {})
        out[row["id"]] = {
            "id": row["id"],
            "courseId": row.get("course_id"),
            "courseName": courses.get(row.get("course_id"), {}).get("name"),
            "facultyId": row.get("faculty_id"),
            "facultyName": faculty.get(row.get("faculty_id"), {}).get("name"),
            "classId": row.get("class_id"),
            "classDivision": class_row.get("division"),
            "classYear": class_row.get("year"),
        }
    return out


@assistant_bp.get("/<college>/assistant/labs")
def get_assistant_labs(college: str):
    guard = _require_assistant_role()
    if guard:
        return guard

    assistant_id = _assistant_id_from_request()
    if not assistant_id:
        return jsonify({"success": False, "error": "assistantId is required", "statusCode": 400}), 400

    try:
        assistant_id_int = int(assistant_id)
        if assistant_id_int > 2147483647 or assistant_id_int < -2147483648:
            return jsonify({"success": True, "data": [], "total": 0, "page": 1, "pageSize": 50}), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid assistant ID format", "statusCode": 400}), 400

    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        assistant = db.assistants.find_one({"id": assistant_id_int}, {"_id": 0, "id": 1, "name": 1, "lab_id": 1})
        if not assistant or not assistant.get("lab_id"):
            return jsonify({"success": True, "data": []}), 200

        lab = db.labs.find_one({"id": assistant["lab_id"], "college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1})
        if not lab:
            return jsonify({"success": True, "data": []}), 200

        return jsonify({"success": True, "data": [{"id": lab["id"], "labNo": str(lab["id"]), "name": lab.get("name") or f"Computer Lab {lab['id']}", "floor": lab.get("floor"), "assignedAssistantId": assistant["id"], "assignedAssistantName": assistant.get("name")}] }), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch assistant labs", "statusCode": 500, "details": str(exc)}), 500


@assistant_bp.get("/<college>/assistant/labs/<int:lab_id>")
def get_assistant_lab_timetable(college: str, lab_id: int):
    guard = _require_assistant_role()
    if guard:
        return guard

    assistant_id = _assistant_id_from_request()
    if not assistant_id:
        return jsonify({"success": False, "error": "assistantId is required", "statusCode": 400}), 400

    try:
        assistant_id_int = int(assistant_id)
        if assistant_id_int > 2147483647 or assistant_id_int < -2147483648:
            return jsonify({"success": False, "error": "Assistant is not assigned to this lab", "statusCode": 403}), 403
    except ValueError:
        return jsonify({"success": False, "error": "Invalid assistant ID format", "statusCode": 400}), 400

    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        assistant = db.assistants.find_one({"id": assistant_id_int}, {"_id": 0, "lab_id": 1})
        if not assistant or assistant.get("lab_id") != lab_id:
            return jsonify({"success": False, "error": "Assistant is not assigned to this lab", "statusCode": 403}), 403

        lab = db.labs.find_one({"id": lab_id, "college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1})
        if not lab:
            return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404

        tt = db.timetable.find_one({"lab_id": lab_id}, {"_id": 0, "mon_slot_id": 1, "tue_slot_id": 1, "wed_slot_id": 1, "thur_slot_id": 1, "fri_slot_id": 1}) or {}
        slot_ids = [tt.get(_DAY_FIELD_MAP[day]) for day in _DAY_KEYS if tt.get(_DAY_FIELD_MAP[day]) is not None]
        slots_map = _fetch_slots_map(db, slot_ids)

        timetable = {}
        for day in _DAY_KEYS:
            slot_id = tt.get(_DAY_FIELD_MAP[day])
            timetable[day] = slots_map.get(slot_id) if slot_id else None

        return jsonify({"success": True, "data": {"lab": {"id": lab["id"], "labNo": str(lab["id"]), "name": lab.get("name") or f"Computer Lab {lab['id']}", "floor": lab.get("floor")}, "timetable": timetable}}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch assistant lab timetable", "statusCode": 500, "details": str(exc)}), 500
