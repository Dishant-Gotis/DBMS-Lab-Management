from flask import Flask

from .assistant import assistant_bp
from .faculty import faculty_bp
from .health import health_bp
from .labs import labs_bp
from .seeding import seeding_bp
from .admin_labs import admin_labs_bp
from .admin_assistants import admin_assistants_bp
from .admin_faculty import admin_faculty_bp

def register_blueprints(app: Flask) -> None:
    app.register_blueprint(assistant_bp, url_prefix="/api")
    app.register_blueprint(faculty_bp, url_prefix="/api")
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(labs_bp, url_prefix="/api")
    app.register_blueprint(seeding_bp, url_prefix="/api")
    app.register_blueprint(admin_labs_bp, url_prefix="/api")
    app.register_blueprint(admin_assistants_bp, url_prefix="/api")
    app.register_blueprint(admin_faculty_bp, url_prefix="/api")
