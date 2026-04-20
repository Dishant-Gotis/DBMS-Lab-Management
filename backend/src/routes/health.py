from flask import Blueprint, jsonify

from extensions import mongo_ping


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    try:
        mongo_ping()
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
