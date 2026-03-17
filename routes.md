# DBMS Lab Management — Backend API Specification

> **Stack:** Python (Flask) + psycopg2 + PostgreSQL
> **Base URL:** `http://localhost:5000/api`
> **Auth / Guards:** Simple header-based signals are used in lieu of JWT until RBAC is wired up. Most routes inspect `X-Role` along with `X-Assistant-Id`, `X-Faculty-Id`, or `X-Seed-Key` where noted.
> **Content-Type:** `application/json`

---

## Table of Contents

1. [Health](#1-health)
2. [Labs](#2-labs)
3. [PC + Software Details](#3-pc--software-details)
4. [Lab Assistants](#4-lab-assistants)
5. [Faculty](#5-faculty)
6. [Seeding / Admin Helpers](#6-seeding--admin-helpers)
7. [Response Envelope](#7-response-envelope)

---

## 1. Health

### GET `/api/health`
Ping the service and confirm PostgreSQL connectivity.

**Headers:** none

**Response `200`:**
```json
{
  "success": true,
  "status": "ok",
  "database": "reachable"
}
```

**Response `503`:**
```json
{
  "success": false,
  "status": "down",
  "error": "Database health check failed",
  "details": "...postgres error..."
}
```

---

## 2. Labs
Each labs route is scoped to a college identifier (`<college>` path segment). College resolution is done via `resolve_college()` which looks up the slug or name provided in the URL.

### GET `/api/<college>/labs`
List labs for a college. Pagination defaults to page 1 / 50 rows.

**Headers:** none
**Query Params:**
| Name | Type | Description |
|------|------|-------------|
| `q` | string | Search against numeric ID or lab name, case-insensitive. |
| `page` | integer | 1-based page number. |
| `pageSize` | integer | Rows per page. |

**Response `200`:**
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
  "total": 2,
  "page": 1,
  "pageSize": 50
}
```

### GET `/api/<college>/labs/lab/<lab_id>`
Fetch a single lab record.

**Response `404`** if college or lab is missing.

### GET `/api/<college>/labs/<pc_id>`
Return PC metadata plus any software installed (password and OS details are currently returned as-is).

**Response `200`:**
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
        "installedAt": "2026-03-10T..."
      }
    ]
  }
}
```

---

## 3. PC + Software Details
The `/api/<college>/labs/<pc_id>` response already includes software. There are no separate management endpoints for installing/uninstalling software yet; each `software` entry stores `pc_id` directly.

---

## 4. Lab Assistants
Assistant routes require `X-Role: assistant` plus either the header `X-Assistant-Id` or query param `assistantId`.

### GET `/api/<college>/assistant/labs`
Return labs assigned to that assistant.

**Response `200`:**
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

### GET `/api/<college>/assistant/labs/<lab_id>`
Return the assigned lab's weekly timetable. Headers same as above.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "lab": {...},
    "timetable": {
      "mon": {"id": 1, "courseName": "DBMS Lab", ...},
      "tue": { ... },
      "wed": null,
      "thur": null,
      "fri": null
    }
  }
}
```

If the assistant is not assigned to the requested lab, the route returns `403` with `"Assistant is not assigned to this lab"`.

---

## 5. Faculty
Faculty routes require `X-Role: faculty` and either header `X-Faculty-Id` or query param `facultyId`.

### GET `/api/<college>/faculty/labs`
Return labs that appear in the faculty member's timetable.

### GET `/api/<college>/faculty/labs/<lab_id>`
Return the lab plus timetable, but only days where the faculty member actually owns the slot.

**Response `403`** if the faculty has no entry for that lab.

---

## 6. Seeding / Admin Helpers
These endpoints are guarded by `X-Role: admin` and `X-Seed-Key: <value>` (default `seed-dev-key` in `.env`). They are temporary helpers for populating the database.

| Endpoint | Method | Payload | Notes |
|----------|--------|---------|-------|
| `/api/seed/ping-db` | `GET` | none | Verifies DB connectivity. |
| `/api/seed/colleges` | `POST` | `{name, city, pincode, state}` | Returns created college row. |
| `/api/seed/labs` | `POST` | `{college_id, name?, floor}` | `name` optional. |
| `/api/seed/os` | `POST` | `{name, version}` | |
| `/api/seed/pcs` | `POST` | `{password, os_id, lab_id}` | Returns inserted ID plus assigned lab. |
| `/api/seed/assistants` | `POST` | `{name, password, email, phone, lab_id}` | |
| `/api/seed/software` | `POST` | `{name, version?, pc_id}` | `version` optional. |
| `/api/seed/classes` | `POST` | `{division, year, floor, strength}` | |
| `/api/seed/faculty` | `POST` | `{name, password, email, phone}` | |
| `/api/seed/courses` | `POST` | `{name, duration_weeks, credits}` | |
| `/api/seed/slots` | `POST` | `{course_id, faculty_id, class_id}` | |
| `/api/seed/timetable` | `POST` | `{lab_id, mon_slot_id?, tue_slot_id?, wed_slot_id?, thur_slot_id?, fri_slot_id?}` | Each slot is nullable; returns the inserted timetable row. |

Each request returns `201` on success with the created row or `500` plus `details` on failure.

---

## 7. Response Envelope
All routes return at least `{ "success": boolean, "error"?, "statusCode"? }`. Successful responses include a `data` payload or `message` as shown above. On all `403` / `404` / `500` responses the `statusCode` property mirrors the HTTP status.

---

If new features or auth behavior are added later, this spec should be revisited so the Frontend matches the service surface area documented here.
