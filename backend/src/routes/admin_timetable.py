from flask import Blueprint, jsonify, request

from extensions import get_db, get_next_sequence
from .api_utils import bad_request, get_db_and_college, not_found, require_role, server_error


admin_timetable_bp = Blueprint("admin_timetable", __name__)

_DAY_TO_FIELD = {
    "mon": "mon_slot_id",
    "tue": "tue_slot_id",
    "wed": "wed_slot_id",
    "thur": "thur_slot_id",
    "fri": "fri_slot_id",
}


def _require_admin_role():
    return require_role("admin", "Only admins can access these endpoints")


@admin_timetable_bp.get("/<college>/admin/timetable/meta")
def get_admin_timetable_meta(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        labs = list(db.labs.find({"college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1, "floor": 1}).sort("id", 1))
        for row in labs:
            row["labNo"] = str(row["id"])
            row["name"] = row.get("name") or f"Computer Lab {row['id']}"

        class_rows = list(db.classes.find({}, {"_id": 0, "id": 1, "division": 1, "year": 1}).sort("id", 1))
        classes = [{"id": str(row["id"]), "name": f"{row['division']} (Year {row['year']})"} for row in class_rows]

        course_rows = list(db.courses.find({}, {"_id": 0, "id": 1, "name": 1}).sort("id", 1))
        courses = [{"id": str(row["id"]), "name": row.get("name")} for row in course_rows]

        faculty_rows = list(db.faculty.find({}, {"_id": 0, "id": 1, "name": 1}).sort("id", 1))
        faculty = [{"id": str(row["id"]), "name": row.get("name")} for row in faculty_rows]

        return jsonify({"success": True, "data": {"labs": labs, "classes": classes, "courses": courses, "faculty": faculty}}), 200
    except Exception as exc:
        return server_error("Failed to fetch timetable meta", exc)


@admin_timetable_bp.post("/<college>/admin/timetable/slots")
def create_admin_slot(college: str):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    course_id = payload.get("course_id")
    faculty_id = payload.get("faculty_id")
    class_id = payload.get("class_id")

    if not all([course_id, faculty_id, class_id]):
        return bad_request("course_id, faculty_id and class_id are required")

    try:
        db, _, err = get_db_and_college(college)
        if err:
            return err

        slot_id = get_next_sequence("slots")
        row = {"id": slot_id, "course_id": int(course_id), "faculty_id": int(faculty_id), "class_id": int(class_id)}
        db.slots.insert_one(row)

        return jsonify({"success": True, "data": row, "message": "Slot created"}), 201
    except Exception as exc:
        return server_error("Failed to create slot", exc)


@admin_timetable_bp.put("/<college>/admin/timetable/<int:lab_id>")
def update_admin_timetable_day(college: str, lab_id: int):
    guard = _require_admin_role()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    day = (payload.get("day") or "").strip().lower()
    slot_id = payload.get("slot_id")

    if day not in _DAY_TO_FIELD:
        return bad_request("day must be one of: mon, tue, wed, thur, fri")

    try:
        db, college_row, err = get_db_and_college(college)
        if err:
            return err

        if not db.labs.find_one({"id": lab_id, "college_id": college_row["id"]}, {"_id": 1}):
            return not_found("Lab not found")

        field = _DAY_TO_FIELD[day]
        db.timetable.update_one(
            {"lab_id": lab_id},
            {"$set": {field: int(slot_id) if slot_id is not None else None}},
            upsert=True,
        )

        row = db.timetable.find_one(
            {"lab_id": lab_id},
            {"_id": 0, "lab_id": 1, "mon_slot_id": 1, "tue_slot_id": 1, "wed_slot_id": 1, "thur_slot_id": 1, "fri_slot_id": 1},
        )

        return jsonify({"success": True, "data": row, "message": "Timetable updated"}), 200
    except Exception as exc:
        return server_error("Failed to update timetable", exc)
