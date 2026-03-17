from psycopg2.extensions import cursor


def resolve_college(cur: cursor, college: str):
    college_value = college.strip()
    if not college_value:
        return None

    if college_value.isdigit():
        cur.execute(
            """
            SELECT id, name, city, state, pincode
            FROM colleges
            WHERE id = %s
            """,
            (int(college_value),),
        )
        return cur.fetchone()

    cur.execute(
        """
        SELECT id, name, city, state, pincode
        FROM colleges
        WHERE lower(name) = lower(%s)
           OR regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') = lower(%s)
        LIMIT 1
        """,
        (college_value, college_value),
    )
    return cur.fetchone()