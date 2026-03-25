from flask import Blueprint, jsonify

from extensions import get_db_connection, get_dict_cursor
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
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT
                    cls.id,
                    cls.division,
                    cls.year,
                    cls.floor,
                    cls.strength
                FROM classes cls
                ORDER BY cls.id
                """
            )
            rows = cur.fetchall()
            for row in rows:
                row["name"] = f"Class {row['id']} - {row['division']} (Year {row['year']})"

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch classes", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@catalog_bp.get("/<college>/courses")
def get_courses(college: str):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT id, name, duration_weeks AS "durationWeeks", credits
                FROM courses
                ORDER BY id
                """
            )
            rows = cur.fetchall()

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch courses", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@catalog_bp.get("/<college>/faculty")
def get_faculty(college: str):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT
                    f.id,
                    f.name,
                    f.email,
                    f.phone,
                    'Computer' AS department,
                    COUNT(DISTINCT s.course_id) AS "coursesCount"
                FROM faculty f
                LEFT JOIN slots s ON s.faculty_id = f.id
                GROUP BY f.id, f.name, f.email, f.phone
                ORDER BY f.name
                """
            )
            rows = cur.fetchall()

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch faculty", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@catalog_bp.get("/<college>/pcs")
def get_pcs(college: str):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT
                    p.id,
                    p.pc_no AS "pcNo",
                    p.lab_id AS "labId",
                    l.name AS "labName",
                    o.name AS "osName",
                    o.version AS "osVersion",
                    p.processor,
                    p.ram,
                    p.storage,
                    p.status
                FROM pcs p
                JOIN labs l ON l.id = p.lab_id
                LEFT JOIN os o ON o.id = p.os_id
                WHERE l.college_id = %s
                ORDER BY p.id
                """,
                (college_row["id"],),
            )
            rows = cur.fetchall()
            for row in rows:
                row["pcNo"] = row["pcNo"] or f"PC-{row['id']}"
                row["labName"] = row["labName"] or f"Computer Lab {row['labId']}"
                os_name = row.pop("osName", None) or "Unknown OS"
                os_version = row.pop("osVersion", None) or ""
                row["os"] = (f"{os_name} {os_version}").strip()
                row["processor"] = row["processor"] or "Unknown Processor"
                row["ram"] = row["ram"] or "Unknown RAM"
                row["storage"] = row["storage"] or "Unknown Storage"
                row["status"] = row["status"] or "active"

        return jsonify({"success": True, "data": rows}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch PCs", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()


@catalog_bp.get("/<college>/software")
def get_software(college: str):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return jsonify({"success": False, "error": "College not found", "statusCode": 404}), 404

            cur.execute(
                """
                SELECT
                    s.id,
                    s.name,
                    s.version,
                    s.installed_at AS "installDate",
                    s.pc_id AS "pcId",
                    p.pc_no AS "pcNo",
                    p.lab_id AS "labId",
                    l.name AS "labName"
                FROM software s
                JOIN pcs p ON p.id = s.pc_id
                JOIN labs l ON l.id = p.lab_id
                WHERE l.college_id = %s
                ORDER BY s.installed_at DESC
                """,
                (college_row["id"],),
            )
            rows = cur.fetchall()

        data = []
        for row in rows:
            row["version"] = row["version"] or "N/A"
            row["pcNo"] = row["pcNo"] or f"PC-{row['pcId']}"
            row["labName"] = row["labName"] or f"Computer Lab {row['labId']}"
            row["category"] = _category_for_software(row.get("name", ""))
            data.append(row)

        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify({"success": False, "error": "Failed to fetch software", "statusCode": 500, "details": str(exc)}), 500
    finally:
        if conn:
            conn.close()
