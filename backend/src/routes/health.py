from flask import Blueprint, jsonify

from extensions import get_db_connection, get_dict_cursor


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    conn = None
    try:
        conn = get_db_connection()
        with get_dict_cursor(conn) as cur:
            cur.execute("SELECT 1 AS ok")
            cur.fetchone()
        return jsonify({"success": True, "status": "ok", "database": "reachable"}), 200
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "status": "down",
                    "error": "Database health check failed",
                    "details": str(exc),
                }
            ),
            503,
        )
    finally:
        if conn:
            conn.close()