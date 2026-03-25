from flask import Flask

from .auth import auth_bp
from .assistant import assistant_bp
from .faculty import faculty_bp
from .health import health_bp
from .labs import labs_bp
from .admin_labs import admin_labs_bp
from .admin_assistants import admin_assistants_bp
from .admin_faculty import admin_faculty_bp
from .admin_timetable import admin_timetable_bp
from .timetable import timetable_bp
from .catalog import catalog_bp

def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(assistant_bp, url_prefix="/api")
    app.register_blueprint(faculty_bp, url_prefix="/api")
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(labs_bp, url_prefix="/api")
    app.register_blueprint(admin_labs_bp, url_prefix="/api")
    app.register_blueprint(admin_assistants_bp, url_prefix="/api")
    app.register_blueprint(admin_faculty_bp, url_prefix="/api")
    app.register_blueprint(admin_timetable_bp, url_prefix="/api")
    app.register_blueprint(timetable_bp, url_prefix="/api")
    app.register_blueprint(catalog_bp, url_prefix="/api")
