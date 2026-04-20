import os

from pymongo import MongoClient, ReturnDocument


_client: MongoClient | None = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        _client = MongoClient(mongo_uri)
    return _client


def get_db():
    db_name = os.getenv("MONGO_DB_NAME", "dbms_project")
    return _get_client()[db_name]


def get_next_sequence(name: str) -> int:
    db = get_db()
    counter = db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(counter["seq"])


def mongo_ping() -> None:
    _get_client().admin.command("ping")
