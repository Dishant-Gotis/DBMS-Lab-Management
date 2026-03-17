# DBMS Backend API Progress (Current)

Base URL: `/api`

Notes:
- College path segment is now required in all routes as `:college`.
- `:college` supports either numeric college ID (for example `1`) or college name slug (for example `pccoe-pune`).
- Placeholder auth is currently used for faculty and assistant routes.
- All responses use a standard envelope with `success` and either `data` or `error`.

## 1) General Labs (College Scoped)

### GET `/api/:college/labs`
Purpose:
- List all labs within one college.

Query Params:
- `q` (optional, string): Search by lab id/labNo or lab name.
- `page` (optional, int, default `1`): Pagination page.
- `pageSize` (optional, int, default `50`): Page size.

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "labNo": "1",
      "name": "Computer Lab 6101",
      "floor": 6,
      "assignedAssistantId": 1,
      "assignedAssistantName": "Raj Patel"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 50
}
```

Error Responses:
- `404` when college not found.
- `500` for internal server/database failures.

### GET `/api/:college/labs/lab/:id`
Purpose:
- Get one lab record by lab ID inside a college.

Path Params:
- `id` (required, int): Lab ID.

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "labNo": "1",
    "name": "Computer Lab 6101",
    "floor": 6,
    "assignedAssistantId": 1,
    "assignedAssistantName": "Raj Patel"
  }
}
```

Error Responses:
- `404` when college or lab not found.
- `500` for internal server/database failures.

### GET `/api/:college/labs/:pc`
Purpose:
- Get a PC’s details and the software installed on it.
- This is used from general mode and assistant mode UI.

Path Params:
- `pc` (required, int): PC ID.

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "college": {
      "id": 1,
      "name": "PCCOE Pune"
    },
    "pc": {
      "id": 1,
      "password": "pcpass-1001",
      "osId": 1,
      "osName": "Windows",
      "osVersion": "11 Pro",
      "specDescription": null
    },
    "softwares": [
      {
        "id": 1,
        "name": "Python",
        "version": "3.11.8",
        "installedAt": "2026-03-18T10:00:00"
      }
    ]
  }
}
```

Error Responses:
- `404` when college or PC not found.
- `500` for internal server/database failures.

Current TODO:
- Enforce PC-to-college ownership when schema adds/links PC to lab/college.
- Remove/mask sensitive fields once auth boundaries are finalized.

## 2) Assistant Endpoints (College Scoped)

Auth Placeholder:
- Header `X-Assistant-Id` OR query param `assistantId` is required.

### GET `/api/:college/assistant/labs`
Purpose:
- List only labs assigned to the current assistant in that college.

Query Params:
- `assistantId` (optional if header present)

Headers:
- `X-Assistant-Id` (optional if query param present)

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "labNo": "1",
      "name": "Computer Lab 6101",
      "floor": 6,
      "assignedAssistantId": 1,
      "assignedAssistantName": "Raj Patel"
    }
  ]
}
```

Error Responses:
- `400` when assistant id is missing.
- `404` when college not found.
- `500` for internal server/database failures.

### GET `/api/:college/assistant/labs/:id`
Purpose:
- Show full timetable for that lab (all weekday slot cells), only if assistant is assigned to that lab.

Path Params:
- `id` (required, int): Lab ID.

Query/Header:
- Same assistant identity placeholder as above.

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "lab": {
      "id": 1,
      "labNo": "1",
      "name": "Computer Lab 6101",
      "floor": 6
    },
    "timetable": {
      "mon": {
        "id": 1,
        "courseId": 1,
        "courseName": "DBMS Lab",
        "facultyId": 1,
        "facultyName": "Dr. Mehta",
        "classId": 1,
        "classDivision": "A",
        "classYear": 2
      },
      "tue": null,
      "wed": null,
      "thur": null,
      "fri": null
    }
  }
}
```

Error Responses:
- `400` when assistant id is missing.
- `403` when assistant is not assigned to the requested lab.
- `404` when college or lab not found.
- `500` for internal server/database failures.

Current TODO:
- Replace identity placeholder with JWT middleware.
- Add attendance/usage summary once event logs exist.

## 3) Faculty Endpoints (College Scoped)

Auth Placeholder:
- Header `X-Faculty-Id` OR query param `facultyId` is required.

### GET `/api/:college/faculty/labs`
Purpose:
- List labs where this faculty appears in at least one timetable slot.

Query Params:
- `facultyId` (optional if header present)

Headers:
- `X-Faculty-Id` (optional if query param present)

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "labNo": "1",
      "name": "Computer Lab 6101",
      "floor": 6
    }
  ]
}
```

Error Responses:
- `400` when faculty id is missing.
- `404` when college not found.
- `500` for internal server/database failures.

### GET `/api/:college/faculty/labs/:id`
Purpose:
- Show timetable for one lab, but only the slots assigned to this faculty are populated.
- Other weekday cells are intentionally blank (`null`).

Path Params:
- `id` (required, int): Lab ID.

Query/Header:
- Same faculty identity placeholder as above.

Body:
- None.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "lab": {
      "id": 1,
      "labNo": "1",
      "name": "Computer Lab 6101",
      "floor": 6
    },
    "timetable": {
      "mon": {
        "id": 1,
        "courseId": 1,
        "courseName": "DBMS Lab",
        "facultyId": 1,
        "facultyName": "Dr. Mehta",
        "classId": 1,
        "classDivision": "A",
        "classYear": 2
      },
      "tue": null,
      "wed": {
        "id": 3,
        "courseId": 3,
        "courseName": "Web Programming Lab",
        "facultyId": 1,
        "facultyName": "Dr. Mehta",
        "classId": 3,
        "classDivision": "C",
        "classYear": 4
      },
      "thur": null,
      "fri": null
    }
  }
}
```

Error Responses:
- `400` when faculty id is missing.
- `403` when faculty has no assigned session in this lab.
- `404` when college or lab not found.
- `500` for internal server/database failures.

Current TODO:
- Replace identity placeholder with JWT middleware.
- Add pagination when frontend starts paging this dataset.

## 4) Non-Implemented CRUD Endpoints (Planned)

The following endpoints are planned but not implemented yet:
- POST labs
- PUT labs
- DELETE labs
- PC creation/update/deletion
- Software creation/update/deletion
- Full auth endpoints and role middleware

When implemented, this file should be expanded with request body schemas and sample success/error payloads.
