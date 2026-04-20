from flask import Blueprint, jsonify

from extensions import get_db
from .common import resolve_college


catalog_bp = Blueprint("catalog", __name__)


def _category_for_software(name: str) -> str:
    lower = (name or "").lower()
    if "studio" in lower or "code" in lower or "pycharm" in lower:
        return "IDE"
    if "postgres" in lower or "mysql" in lower or "mongo" in lower:
        return "Database"
    if "python" in lower or "node" in lower or "java" in lower:
        return "Runtime"
    if "docker" in lower or "git" in lower:
        return "DevOps"
    return "Utility"


@catalog_bp.get("/<college>/classes")
def get_classes(college: str):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        rows = list(
            db.classes.find({}, {"_id": 0, "id": 1, "division": 1, "year": 1, "floor": 1, "strength": 1}).sort("id", 1)
        )
        for row in rows:
            row["name"] = f"Class {row['id']} - {row['division']} (Year {row['year']})"

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch classes", "statusCode": 500, "details": str(exc)}), 500


@catalog_bp.get("/<college>/courses")
def get_courses(college: str):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        rows = list(
            db.courses.find({}, {"_id": 0, "id": 1, "name": 1, "duration_weeks": 1, "credits": 1}).sort("id", 1)
        )
        for row in rows:
            row["durationWeeks"] = row.pop("duration_weeks", None)

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch courses", "statusCode": 500, "details": str(exc)}), 500


@catalog_bp.get("/<college>/faculty")
def get_faculty(college: str):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        slots = list(db.slots.find({}, {"_id": 0, "faculty_id": 1, "course_id": 1}))
        courses_by_faculty: dict[int, set[int]] = {}
        for slot in slots:
            faculty_id = slot.get("faculty_id")
            course_id = slot.get("course_id")
            if faculty_id is None or course_id is None:
                continue
            courses_by_faculty.setdefault(int(faculty_id), set()).add(int(course_id))

        rows = list(db.faculty.find({}, {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1}).sort("name", 1))
        data = []
        for row in rows:
            row["department"] = "Computer"
            row["coursesCount"] = len(courses_by_faculty.get(int(row["id"]), set()))
            data.append(row)

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch faculty", "statusCode": 500, "details": str(exc)}), 500


@catalog_bp.get("/<college>/pcs")
def get_pcs(college: str):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        labs = list(db.labs.find({"college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1}))
        lab_ids = [lab["id"] for lab in labs]
        lab_map = {lab["id"]: lab for lab in labs}

        rows = list(
            db.pcs.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "id": 1, "pc_no": 1, "lab_id": 1, "os_id": 1, "processor": 1, "ram": 1, "storage": 1, "status": 1}).sort("id", 1)
        ) if lab_ids else []

        os_ids = list({row.get("os_id") for row in rows if row.get("os_id") is not None})
        os_rows = list(db.os.find({"id": {"$in": os_ids}}, {"_id": 0, "id": 1, "name": 1, "version": 1})) if os_ids else []
        os_map = {o["id"]: o for o in os_rows}

        data = []
        for row in rows:
            lab = lab_map.get(row.get("lab_id"), {})
            os_row = os_map.get(row.get("os_id"), {})
            item = {
                "id": row["id"],
                "pcNo": row.get("pc_no") or f"PC-{row['id']}",
                "labId": row.get("lab_id"),
                "labName": lab.get("name") or f"Computer Lab {row.get('lab_id')}",
                "os": f"{os_row.get('name', 'Unknown OS')} {os_row.get('version', '')}".strip(),
                "processor": row.get("processor") or "Unknown Processor",
                "ram": row.get("ram") or "Unknown RAM",
                "storage": row.get("storage") or "Unknown Storage",
                "status": row.get("status") or "active",
            }
            data.append(item)

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch PCs", "statusCode": 500, "details": str(exc)}), 500


@catalog_bp.get("/<college>/software")
def get_software(college: str):
    try:
        db = get_db()
        college_row = resolve_college(db, college)
        if not college_row:
            return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

        labs = list(db.labs.find({"college_id": college_row["id"]}, {"_id": 0, "id": 1, "name": 1}))
        lab_ids = [lab["id"] for lab in labs]
        lab_map = {lab["id"]: lab for lab in labs}

        pcs = list(db.pcs.find({"lab_id": {"$in": lab_ids}}, {"_id": 0, "id": 1, "pc_no": 1, "lab_id": 1})) if lab_ids else []
        pc_ids = [pc["id"] for pc in pcs]
        pc_map = {pc["id"]: pc for pc in pcs}

        rows = list(db.software.find({"pc_id": {"$in": pc_ids}}, {"_id": 0, "id": 1, "name": 1, "version": 1, "installed_at": 1, "pc_id": 1}).sort("installed_at", -1)) if pc_ids else []

        data = []
        for row in rows:
            pc_row = pc_map.get(row.get("pc_id"), {})
            lab_row = lab_map.get(pc_row.get("lab_id"), {})
            data.append(
                {
                    "id": row.get("id"),
                    "name": row.get("name"),
                    "version": row.get("version") or "N/A",
                    "installDate": row.get("installed_at"),
                    "pcId": row.get("pc_id"),
                    "pcNo": pc_row.get("pc_no") or f"PC-{row.get('pc_id')}",
                    "labId": pc_row.get("lab_id"),
                    "labName": lab_row.get("name") or f"Computer Lab {pc_row.get('lab_id')}",
                    "category": _category_for_software(row.get("name", "")),
                }
            )

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch software", "statusCode": 500, "details": str(exc)}), 500
