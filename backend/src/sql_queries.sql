SELECT id, name, city, state, pincode
FROM colleges
WHERE id = %s;

SELECT id, name, city, state, pincode
FROM colleges
WHERE lower(name) = lower(%s)
LIMIT 1;

SELECT id, name, email
FROM faculty
WHERE lower(email) = %s AND password = %s
LIMIT 1;

SELECT a.id, a.name, a.email, a.lab_id, l.id AS lab_no
FROM assistants a
LEFT JOIN labs l ON l.id = a.lab_id
WHERE lower(a.email) = %s AND a.password = %s
LIMIT 1;

SELECT COUNT(*) AS total
FROM labs l
WHERE l.college_id = %s
  AND (%s = '' OR (%s IS NOT NULL AND l.id = %s) OR l.name ILIKE %s);

SELECT l.id, l.id AS "labNo", l.name, l.floor,
       a.id AS "assignedAssistantId", a.name AS "assignedAssistantName"
FROM labs l
LEFT JOIN assistants a ON a.lab_id = l.id
WHERE l.college_id = %s
  AND (%s = '' OR (%s IS NOT NULL AND l.id = %s) OR l.name ILIKE %s)
ORDER BY l.id;

SELECT l.id, l.id AS "labNo", l.name, l.floor,
       a.id AS "assignedAssistantId", a.name AS "assignedAssistantName"
FROM labs l
LEFT JOIN assistants a ON a.lab_id = l.id
WHERE l.id = %s AND l.college_id = %s;

SELECT p.id, p.password, p.os_id AS "osId", o.name AS "osName", o.version AS "osVersion"
FROM pcs p
LEFT JOIN os o ON o.id = p.os_id
WHERE p.id = %s;

SELECT id, name, version, installed_at AS "installedAt"
FROM software
WHERE pc_id = %s
ORDER BY installed_at DESC;

SELECT l.id, l.id AS "labNo", l.name, l.floor,
       a.id AS "assignedAssistantId", a.name AS "assignedAssistantName"
FROM assistants a
JOIN labs l ON l.id = a.lab_id
WHERE a.id = %s AND l.college_id = %s;

SELECT 1
FROM assistants a
JOIN labs l ON l.id = a.lab_id
WHERE a.id = %s AND a.lab_id = %s AND l.college_id = %s;

SELECT s.id, s.course_id AS "courseId", c.name AS "courseName",
       s.faculty_id AS "facultyId", f.name AS "facultyName",
       s.class_id AS "classId", cls.division AS "classDivision", cls.year AS "classYear"
FROM slots s
LEFT JOIN courses c ON c.id = s.course_id
LEFT JOIN faculty f ON f.id = s.faculty_id
LEFT JOIN classes cls ON cls.id = s.class_id
WHERE s.id = ANY(%s);

SELECT DISTINCT l.id, l.id AS "labNo", l.name, l.floor,
       a.id AS "assignedAssistantId", a.name AS "assignedAssistantName"
FROM labs l
LEFT JOIN assistants a ON a.lab_id = l.id
JOIN timetable t ON t.lab_id = l.id
JOIN slots s ON s.id IN (t.mon_slot_id, t.tue_slot_id, t.wed_slot_id, t.thur_slot_id, t.fri_slot_id)
WHERE l.college_id = %s
  AND s.faculty_id = %s
ORDER BY l.id;

SELECT p.id, p.pc_no AS "pcNo", p.lab_id AS "labId", l.name AS "labName",
       o.name AS "osName", o.version AS "osVersion", p.processor, p.ram, p.storage, p.status
FROM pcs p
JOIN labs l ON l.id = p.lab_id
LEFT JOIN os o ON o.id = p.os_id
WHERE l.college_id = %s
ORDER BY p.id;

SELECT s.id, s.name, s.version, s.installed_at AS "installDate", s.pc_id AS "pcId",
       p.pc_no AS "pcNo", p.lab_id AS "labId", l.name AS "labName"
FROM software s
JOIN pcs p ON p.id = s.pc_id
JOIN labs l ON l.id = p.lab_id
WHERE l.college_id = %s
ORDER BY s.installed_at DESC;


-- CREATE

INSERT INTO assistants (name, email, phone, password, lab_id)
VALUES (%s, %s, %s, %s, %s)
RETURNING id, name, email, phone, password, lab_id AS "labId";

INSERT INTO faculty (name, email, phone, password)
VALUES (%s, %s, %s, %s)
RETURNING id, name, email, phone;

INSERT INTO labs (college_id, floor, name)
VALUES (%s, %s, %s)
RETURNING id, college_id, floor, name;

INSERT INTO pcs (password, os_id, lab_id, processor, ram, storage, pc_no, status)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id, pc_no AS "pcNo", status, password, os_id AS "osId", processor, ram, storage;

INSERT INTO software (name, version, pc_id)
VALUES (%s, %s, %s)
RETURNING id, name, version, pc_id AS "pcId", installed_at AS "installedAt";

INSERT INTO slots (course_id, faculty_id, class_id)
VALUES (%s, %s, %s)
RETURNING id, course_id, faculty_id, class_id;

INSERT INTO timetable (lab_id)
VALUES (%s)
ON CONFLICT (lab_id) DO NOTHING;


-- UPDATE

UPDATE assistants
SET lab_id = %s
WHERE id = %s
RETURNING id, name, lab_id AS "labId";


-- DELETE

DELETE FROM assistants
WHERE id = %s
RETURNING id;

DELETE FROM faculty
WHERE id = %s
RETURNING id;

DELETE FROM software
WHERE pc_id IN (SELECT id FROM pcs WHERE lab_id = %s);

DELETE FROM pcs
WHERE lab_id = %s;

DELETE FROM labs
WHERE id = %s
RETURNING id;

DELETE FROM software
WHERE id = %s
RETURNING id;
