# Backend Routes and Functions (Concise)

## Auth
- POST /api/auth/login -> login: Role-based login for admin, faculty, assistant.

## Health
- GET /api/health -> health_check: API/database availability check.

## Labs (General)
- GET /api/<college>/labs -> get_labs: List labs with pagination and optional search.
- GET /api/<college>/labs/lab/<lab_id> -> get_lab_by_id: Fetch one lab.
- GET /api/<college>/labs/<pc_id> -> get_pc_software_details: Fetch PC + installed software details.

## Assistant
- GET /api/<college>/assistant/labs -> get_assistant_labs: Labs assigned to assistant.
- GET /api/<college>/assistant/labs/<lab_id> -> get_assistant_lab_timetable: Assistant view of one lab timetable.

## Faculty
- GET /api/<college>/faculty/labs -> get_faculty_labs: Labs where faculty has assigned slots.
- GET /api/<college>/faculty/labs/<lab_id> -> get_faculty_lab_timetable: Faculty-filtered timetable for one lab.

## Admin Labs (CRUD)
- POST /api/<college>/admin/labs -> create_admin_lab: Create lab.
- GET /api/<college>/admin/labs/<lab_id>/pcs -> get_admin_lab_pcs: List PCs in lab (with software).
- POST /api/<college>/admin/labs/<lab_id>/pcs -> create_admin_lab_pc: Create PC in lab.
- POST /api/<college>/admin/pcs/<pc_id>/software -> install_pc_software: Install software on PC.
- DELETE /api/<college>/admin/labs/<lab_id> -> delete_admin_lab: Delete lab and dependent records.
- DELETE /api/<college>/admin/labs/<lab_id>/pcs/<pc_id> -> delete_admin_lab_pc: Delete one PC in a lab.
- DELETE /api/<college>/admin/software/<sw_id> -> delete_admin_software: Delete one software record.

## Admin Assistants (CRUD)
- GET /api/<college>/admin/assistants -> get_assistants: List assistants for college labs.
- POST /api/<college>/admin/assistants -> create_assistant: Create assistant.
- DELETE /api/<college>/admin/assistants/<assistant_id> -> delete_assistant: Delete assistant.
- PUT /api/<college>/admin/assistants/<assistant_id>/assign -> assign_assistant_lab: Assign assistant to lab.

## Admin Faculty (CRUD)
- GET /api/<college>/admin/faculty -> get_faculty: List faculty.
- POST /api/<college>/admin/faculty -> create_faculty: Create faculty.
- DELETE /api/<college>/admin/faculty/<faculty_id> -> delete_faculty: Delete faculty.

## Admin Timetable (CRUD-like)
- GET /api/<college>/admin/timetable/meta -> get_admin_timetable_meta: Fetch labs/classes/courses/faculty metadata.
- POST /api/<college>/admin/timetable/slots -> create_admin_slot: Create timetable slot.
- PUT /api/<college>/admin/timetable/<lab_id> -> update_admin_timetable_day: Set one day slot for lab timetable.

## Timetable (General)
- GET /api/<college>/timetable -> get_timetable: Full timetable entries + metadata for college.

## Catalog (General)
- GET /api/<college>/classes -> get_classes: Classes catalog.
- GET /api/<college>/courses -> get_courses: Courses catalog.
- GET /api/<college>/faculty -> get_faculty: Faculty catalog with course counts.
- GET /api/<college>/pcs -> get_pcs: PC catalog.
- GET /api/<college>/software -> get_software: Software catalog.
