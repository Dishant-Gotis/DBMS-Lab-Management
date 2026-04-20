from flask import Blueprint, jsonify, request

from extensions import get_db
from .common import resolve_college

faculty_bp = Blueprint("faculty", __name__)

_DAY_KEYS = ["mon", "tue", "wed", "thur", "fri"]
_DAY_FIELD_MAP = {
    "mon": "mon_slot_id",
    "tue": "tue_slot_id",
    "wed": "wed_slot_id",
    "thur": "thur_slot_id",
    "fri": "fri_slot_id",
}


def _require_faculty_role():
    role = request.headers.get("X-Role", "")
    if role != "faculty":
        return jsonify({"success": False, "error": "Only faculty role can access this route", "statusCode": 403}), 403
    return None


def _faculty_id_from_request() -> str | None:
    faculty_id = request.headers.get("X-Faculty-Id") or request.args.get("facultyId")
    if not faculty_id:
        return None
    faculty_id = faculty_id.strip()
    if faculty_id.startswith("user-"):
        faculty_id = faculty_id.replace("user-", "")
    return faculty_id


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


@faculty_bp.get("/<college>/faculty/labs")
def get_faculty_labs(college: str):
    guard = _require_faculty_role()
    if guard:
        return guard

    faculty_id = _faculty_id_from_request()
    if not faculty_id:
        return jsonify({"success": False, "error": "facultyId is required", "statusCode": 400}), 400

    try:
        faculty_id_int = int(faculty_id)
        if faculty_id_int > 2147483647 or faculty_id_int < -2147483648:
            return jsonify({"success": True, "data": [], "total": 0, "page": 1, "pageSize": 50}), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid faculty ID format", "statusCode": 400}), 400

    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        faculty_slot_ids = {
            row["id"] for row in db.slots.find({"faculty_id": faculty_id_int}, {"_id": 0, "id": 1})
        }
        if not faculty_slot_ids:
            return jsonify({"success": True, "data": []}), 200

        labs = list(db.labs.find({"college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1}).sort("id", 1))
        lab_ids = [lab["id"] for lab in labs]
        tt_rows = list(db.timetable.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "lab_id": 1, "mon_slot_id": 1, "tue_slot_id": 1, "wed_slot_id": 1, "thur_slot_id": 1, "fri_slot_id": 1})) if lab_ids else []
        tt_map = {row["lab_id"]: row for row in tt_rows}

        assistants = list(db.assistants.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "id": 1, "name": 1, "lab_id": 1})) if lab_ids else []
        assistant_map = {}
        for assistant in assistants:
            assistant_map.setdefault(assistant.get("lab_id"), assistant)

        data = []
        for lab in labs:
            tt = tt_map.get(lab["id"], {})
            has_slot = any(tt.get(_DAY_FIELD_MAP[day]) in faculty_slot_ids for day in _DAY_KEYS)
            if not has_slot:
                continue
            assistant = assistant_map.get(lab["id"])
            data.append(
                {
                    "id": lab["id"],
                    "labNo": str(lab["id"]),
                    "name": lab.get("name") or f"Computer Lab {lab['id']}",
                    "floor": lab.get("floor"),
                    "assignedAssistantId": assistant.get("id") if assistant else None,
                    "assignedAssistantName": assistant.get("name") if assistant else None,
                }
            )

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch faculty labs", "statusCode": 500, "details": str(exc)}), 500


@faculty_bp.get("/<college>/faculty/labs/<int:lab_id>")
def get_faculty_lab_timetable(college: str, lab_id: int):
    guard = _require_faculty_role()
    if guard:
        return guard

    faculty_id = _faculty_id_from_request()
    if not faculty_id:
        return jsonify({"success": False, "error": "facultyId is required", "statusCode": 400}), 400

    try:
        faculty_id_int = int(faculty_id)
        if faculty_id_int > 2147483647 or faculty_id_int < -2147483648:
            return jsonify({"success": False, "error": "Faculty has no assigned session in this lab", "statusCode": 403}), 403
    except ValueError:
        return jsonify({"success": False, "error": "Invalid faculty ID format", "statusCode": 400}), 400

    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        lab = db.labs.find_one({"id": lab_id, "college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1})
        if not lab:
            return jsonify({"success": False, "error": "Lab not found", "statusCode": 404}), 404

        tt = db.timetable.find_one({"lab_id": lab_id}, {"_id": 0, "mon_slot_id": 1, "tue_slot_id": 1, "wed_slot_id": 1, "thur_slot_id": 1, "fri_slot_id": 1}) or {}
        slot_ids = [tt.get(_DAY_FIELD_MAP[day]) for day in _DAY_KEYS if tt.get(_DAY_FIELD_MAP[day]) is not None]
        slots_map = _fetch_slots_map(db, slot_ids)

        timetable = {}
        has_assigned_slot = False
        for day in _DAY_KEYS:
            slot_id = tt.get(_DAY_FIELD_MAP[day])
            if not slot_id:
                timetable[day] = None
                continue

            slot = slots_map.get(slot_id)
            if not slot or int(slot.get("facultyId") or -1) != faculty_id_int:
                timetable[day] = None
                continue

            timetable[day] = slot
            has_assigned_slot = True

        if not has_assigned_slot:
            return jsonify({"success": False, "error": "Faculty has no assigned session in this lab", "statusCode": 403}), 403

        return jsonify({"success": True, "data": {"lab": {"id": lab["id"], "labNo": str(lab["id"]), "name": lab.get("name") or f"Computer Lab {lab['id']}", "floor": lab.get("floor")}, "timetable": timetable}}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch faculty lab timetable", "statusCode": 500, "details": str(exc)}), 500
