from flask import Blueprint, jsonify, request

from extensions import get_db_connection, get_dict_cursor
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
    search_like = f"%{q}%"
    id_search = int(q) if q.isdigit() else None

    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "College not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            cur.execute(
                """
                SELECT COUNT(*) AS total
                FROM labs l
                WHERE l.college_id = %s
                                    AND (
                                                %s = ''
                                                OR (%s IS NOT NULL AND l.id = %s)
                                                OR l.name ILIKE %s
                                    )
                """,
                                (college_row["id"], q, id_search, id_search, search_like),
            )
            total = cur.fetchone()["total"]

            cur.execute(
                """
                SELECT
                    l.id,
                    l.id AS "labNo",
                    l.name,
                    l.floor,
                    a.id AS "assignedAssistantId",
                    a.name AS "assignedAssistantName"
                FROM labs l
                LEFT JOIN assistants a ON a.lab_id = l.id
                WHERE l.college_id = %s
                  AND (
                        %s = ''
                        OR (%s IS NOT NULL AND l.id = %s)
                        OR l.name ILIKE %s
                  )
                ORDER BY l.id
                LIMIT %s OFFSET %s
                """,
                (college_row["id"], q, id_search, id_search, search_like, page_size, offset),
            )
            rows = cur.fetchall()
            for row in rows:
                row["labNo"] = str(row["labNo"])
                row["name"] = row["name"] or f"Computer Lab {row['id']}"

        return (
            jsonify(
                {
                    "success": True,
                    "data": rows,
                    "total": total,
                    "page": page,
                    "pageSize": page_size,
                }
            ),
            200,
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to fetch labs",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()


@labs_bp.get("/<college>/labs/lab/<int:lab_id>")
def get_lab_by_id(college: str, lab_id: int):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "College not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            cur.execute(
                """
                SELECT
                    l.id,
                    l.id AS "labNo",
                    l.name,
                    l.floor,
                    a.id AS "assignedAssistantId",
                    a.name AS "assignedAssistantName"
                FROM labs l
                LEFT JOIN assistants a ON a.lab_id = l.id
                WHERE l.id = %s AND l.college_id = %s
                """,
                (lab_id, college_row["id"]),
            )
            lab = cur.fetchone()

        if lab:
            lab["labNo"] = str(lab["labNo"])
            lab["name"] = lab["name"] or f"Computer Lab {lab['id']}"

        if not lab:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Lab not found",
                        "statusCode": 404,
                    }
                ),
                404,
            )

        return jsonify({"success": True, "data": lab}), 200
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to fetch lab",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()


@labs_bp.get("/<college>/labs/<int:pc_id>")
def get_pc_software_details(college: str, pc_id: int):
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            college_row = resolve_college(cur, college)
            if not college_row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "College not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            cur.execute(
                """
                SELECT
                    p.id,
                    p.password,
                    p.os_id AS "osId",
                    o.name AS "osName",
                    o.version AS "osVersion"
                FROM pcs p
                LEFT JOIN os o ON o.id = p.os_id
                WHERE p.id = %s
                """,
                (pc_id,),
            )
            pc_row = cur.fetchone()

            if not pc_row:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "PC not found",
                            "statusCode": 404,
                        }
                    ),
                    404,
                )

            cur.execute(
                """
                SELECT
                    id,
                    name,
                    version,
                    installed_at AS "installedAt"
                FROM software
                WHERE pc_id = %s
                ORDER BY installed_at DESC
                """,
                (pc_id,),
            )
            softwares = cur.fetchall()

        return (
            jsonify(
                {
                    "success": True,
                    "data": {
                        "college": {
                            "id": college_row["id"],
                            "name": college_row["name"],
                        },
                        "pc": {
                            "id": pc_row["id"],
                            "password": pc_row["password"],
                            "osId": pc_row["osId"],
                            "osName": pc_row["osName"],
                            "osVersion": pc_row["osVersion"],
                            "specDescription": None,
                        },
                        "softwares": softwares,
                    },
                }
            ),
            200,
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to fetch PC software details",
                    "statusCode": 500,
                    "details": str(exc),
                }
            ),
            500,
        )
    finally:
        if conn:
            conn.close()
