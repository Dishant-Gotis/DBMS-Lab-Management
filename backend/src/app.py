from flask import Flask
from dotenv import load_dotenv

from config import get_config
from routes import register_blueprints

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config())

    register_blueprints(app)

    return app


app = create_app()


if __name__ == "__main__":
    app.run()
