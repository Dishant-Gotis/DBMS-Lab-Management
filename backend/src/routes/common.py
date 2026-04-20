import re


def resolve_college(db, college: str):
    college_value = college.strip()
    if not college_value:
        return None

    normalized = " ".join(college_value.replace("-", " ").split())

    if college_value.isdigit():
        return db.colleges.find_one({"id": int(college_value)}, {"_id": 0})

    escaped_original = re.escape(college_value)
    escaped_normalized = re.escape(normalized)
    return db.colleges.find_one(
        {
            "$or": [
                {"name": {"$regex": f"^{escaped_original}$", "$options": "i"}},
                {"name": {"$regex": f"^{escaped_normalized}$", "$options": "i"}},
            ]
        },
        {"_id": 0},
    )
