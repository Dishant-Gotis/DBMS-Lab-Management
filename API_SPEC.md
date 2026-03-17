# DBMS Lab Management — Backend API Specification

> **Stack:** Python (Flask) + SQL  
> **Base URL:** `http://localhost:5000/api`  
> **Auth:** JWT Bearer Token (`Authorization: Bearer <token>`)  
> **Content-Type:** `application/json`

---

## Table of Contents

1. [Auth](#1-auth)
2. [Labs](#2-labs)
3. [PCs](#3-pcs)
4. [Software](#4-software)
5. [Classes & Courses](#5-classes--courses)
6. [Faculty](#6-faculty)
7. [Timetable](#7-timetable)
8. [Lab Assistants (Admin)](#8-lab-assistants-admin)
9. [Users / Settings](#9-users--settings)
10. [Standard Response Envelope](#10-standard-response-envelope)
11. [Role Permission Matrix](#11-role-permission-matrix)
12. [Database Table Summary](#12-database-table-summary)

---

## 1. Auth

### POST `/api/auth/login`
Authenticate a user and receive a JWT token.

**Roles:** Public (no token needed)

**Request:**
```json
{
  "email": "rajpatel@pccoepune.org",
  "password": "yourpassword",
  "role": "labAssistant"
}
```
> `role` accepted values: `"student"` | `"labAssistant"` | `"faculty"`  
> For admin login, use `/api/auth/admin-login` instead.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-001",
      "name": "Raj Patel",
      "email": "rajpatel@pccoepune.org",
      "role": "labAssistant",
      "assignedLabs": ["6101", "6102", "6103"]
    }
  }
}
```

**Response `401`:**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "statusCode": 401
}
```

---

### POST `/api/auth/admin-login`
Authenticate an admin user with an additional admin key.

**Roles:** Public

**Request:**
```json
{
  "email": "admin@pccoepune.org",
  "password": "yourpassword",
  "adminKey": "ADMIN123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-admin-001",
      "name": "Admin",
      "email": "admin@pccoepune.org",
      "role": "admin",
      "assignedLabs": []
    }
  }
}
```

**Response `403`:**
```json
{
  "success": false,
  "error": "Invalid admin key",
  "statusCode": 403
}
```

---

### POST `/api/auth/logout`
Invalidate the current JWT token (server-side blacklist or short TTL).

**Roles:** Any authenticated

**Request:** _(no body, just Bearer token in header)_

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/me`
Get the currently authenticated user's profile.

**Roles:** Any authenticated

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "usr-001",
    "name": "Raj Patel",
    "email": "rajpatel@pccoepune.org",
    "role": "labAssistant",
    "assignedLabs": ["6101", "6102", "6103"]
  }
}
```

---

## 2. Labs

### GET `/api/labs`
Get all labs. Lab assistants automatically get only their assigned labs (server enforces this via JWT role + assignedLabs).

**Roles:** `labAssistant`, `faculty`, `admin`  
**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by labNo or name |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Results per page (default: 50) |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lab-6101",
      "labNo": "6101",
      "name": "Computer Lab 6101",
      "capacity": 30,
      "description": "Specialized practical lab for batch 61 with modern systems.",
      "assignedAssistantId": "asst-001",
      "assignedAssistantName": "Raj Patel"
    },
    {
      "id": "lab-6102",
      "labNo": "6102",
      "name": "Computer Lab 6102",
      "capacity": 35,
      "description": "Specialized practical lab for batch 61 with modern systems.",
      "assignedAssistantId": null,
      "assignedAssistantName": null
    }
  ],
  "total": 60,
  "page": 1,
  "pageSize": 50
}
```

---

### GET `/api/labs/:labNo`
Get a single lab by its lab number.

**Roles:** `labAssistant` (own labs only), `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "lab-6101",
    "labNo": "6101",
    "name": "Computer Lab 6101",
    "capacity": 30,
    "description": "Specialized practical lab for batch 61 with modern systems.",
    "assignedAssistantId": "asst-001",
    "assignedAssistantName": "Raj Patel"
  }
}
```

**Response `404`:**
```json
{
  "success": false,
  "error": "Lab not found",
  "statusCode": 404
}
```

---

### POST `/api/labs`
Create a new lab.

**Roles:** `admin`

**Request:**
```json
{
  "labNo": "6109",
  "name": "Computer Lab 6109",
  "capacity": 30,
  "description": "New lab for batch 61."
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "lab-6109",
    "labNo": "6109",
    "name": "Computer Lab 6109",
    "capacity": 30,
    "description": "New lab for batch 61.",
    "assignedAssistantId": null,
    "assignedAssistantName": null
  },
  "message": "Lab created successfully"
}
```

**Response `409`:**
```json
{
  "success": false,
  "error": "Lab with this number already exists",
  "statusCode": 409
}
```

---

### PUT `/api/labs/:labNo`
Update lab details.

**Roles:** `admin`

**Request:**
```json
{
  "name": "Computer Lab 6109 (Updated)",
  "capacity": 35,
  "description": "Updated description."
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "lab-6109",
    "labNo": "6109",
    "name": "Computer Lab 6109 (Updated)",
    "capacity": 35,
    "description": "Updated description.",
    "assignedAssistantId": null,
    "assignedAssistantName": null
  },
  "message": "Lab updated successfully"
}
```

---

### DELETE `/api/labs/:labNo`
Delete a lab. Also unassigns any assistant linked to it.

**Roles:** `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Lab deleted successfully"
}
```

---

### PUT `/api/labs/:labNo/assign`
Assign a lab assistant to a lab.

**Roles:** `admin`

**Request:**
```json
{
  "assistantId": "asst-001"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "labNo": "6101",
    "assistantId": "asst-001",
    "assistantName": "Raj Patel",
    "assignedDate": "2026-03-17"
  },
  "message": "Lab assigned successfully"
}
```

---

### DELETE `/api/labs/:labNo/assign`
Unassign a lab assistant from a lab.

**Roles:** `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Lab unassigned successfully"
}
```

---

## 3. PCs

### GET `/api/labs/:labNo/pcs`
Get all PCs for a specific lab.

**Roles:** `labAssistant` (own labs only), `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6101-pc-1",
      "pcNo": "6101-PC-01",
      "labNo": "6101",
      "os": "Windows 11 Pro",
      "processor": "Intel Core i7-12700",
      "ram": "16GB DDR4",
      "storage": "512GB NVMe SSD",
      "gpu": "Intel UHD 770",
      "status": "active"
    },
    {
      "id": "6101-pc-2",
      "pcNo": "6101-PC-02",
      "labNo": "6101",
      "os": "Ubuntu 22.04 LTS",
      "processor": "AMD Ryzen 7 5800X",
      "ram": "32GB DDR4",
      "storage": "1TB NVMe SSD",
      "gpu": "NVIDIA RTX 3060",
      "status": "maintenance"
    }
  ],
  "total": 15
}
```

---

### GET `/api/labs/:labNo/pcs/:pcId`
Get a single PC.

**Roles:** `labAssistant` (own labs only), `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "6101-pc-1",
    "pcNo": "6101-PC-01",
    "labNo": "6101",
    "os": "Windows 11 Pro",
    "processor": "Intel Core i7-12700",
    "ram": "16GB DDR4",
    "storage": "512GB NVMe SSD",
    "gpu": "Intel UHD 770",
    "status": "active"
  }
}
```

---

### POST `/api/labs/:labNo/pcs`
Add a new PC to a lab.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "pcNo": "6101-PC-16",
  "os": "Windows 11 Pro",
  "processor": "Intel Core i5-12400",
  "ram": "16GB DDR4",
  "storage": "512GB SSD",
  "gpu": "Intel UHD 730",
  "status": "active"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "6101-pc-16",
    "pcNo": "6101-PC-16",
    "labNo": "6101",
    "os": "Windows 11 Pro",
    "processor": "Intel Core i5-12400",
    "ram": "16GB DDR4",
    "storage": "512GB SSD",
    "gpu": "Intel UHD 730",
    "status": "active"
  },
  "message": "PC added successfully"
}
```

---

### PUT `/api/labs/:labNo/pcs/:pcId`
Update a PC's specs or status.

**Roles:** `labAssistant` (own labs only), `faculty`, `admin`

**Request:**
```json
{
  "os": "Windows 11 Pro",
  "processor": "Intel Core i9-13900",
  "ram": "32GB DDR5",
  "storage": "1TB NVMe SSD",
  "gpu": "NVIDIA RTX 4060",
  "status": "active"
}
```
> All fields optional — send only what you want to update.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "6101-pc-1",
    "pcNo": "6101-PC-01",
    "labNo": "6101",
    "os": "Windows 11 Pro",
    "processor": "Intel Core i9-13900",
    "ram": "32GB DDR5",
    "storage": "1TB NVMe SSD",
    "gpu": "NVIDIA RTX 4060",
    "status": "active"
  },
  "message": "PC updated successfully"
}
```

---

### DELETE `/api/labs/:labNo/pcs/:pcId`
Delete a PC.

**Roles:** `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "PC deleted successfully"
}
```

---

## 4. Software

### GET `/api/software`
Get all software records.

**Roles:** All authenticated

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by name or category |
| `category` | string | Filter by category (e.g. `"IDE"`, `"Database"`) |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sw-001",
      "name": "Visual Studio Code",
      "version": "1.87.0",
      "category": "IDE",
      "installDate": "2024-01-10",
      "installedOnCount": 45
    },
    {
      "id": "sw-002",
      "name": "MySQL Workbench",
      "version": "8.0.36",
      "category": "Database",
      "installDate": "2024-01-12",
      "installedOnCount": 60
    }
  ],
  "total": 14
}
```

---

### POST `/api/software`
Add new software to the catalog.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "name": "PyCharm",
  "version": "2024.1",
  "category": "IDE",
  "installDate": "2026-03-17"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "sw-015",
    "name": "PyCharm",
    "version": "2024.1",
    "category": "IDE",
    "installDate": "2026-03-17",
    "installedOnCount": 0
  },
  "message": "Software added successfully"
}
```

---

### PUT `/api/software/:id`
Update software details.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "version": "2024.2",
  "category": "IDE"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "sw-015",
    "name": "PyCharm",
    "version": "2024.2",
    "category": "IDE",
    "installDate": "2026-03-17",
    "installedOnCount": 0
  },
  "message": "Software updated successfully"
}
```

---

### DELETE `/api/software/:id`
Delete software from catalog.

**Roles:** `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Software deleted successfully"
}
```

---

### POST `/api/labs/:labNo/pcs/:pcId/software`
Install software on a specific PC.

**Roles:** `labAssistant` (own labs only), `faculty`, `admin`

**Request:**
```json
{
  "softwareId": "sw-001"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Software installed on PC"
}
```

---

### DELETE `/api/labs/:labNo/pcs/:pcId/software/:softwareId`
Uninstall software from a specific PC.

**Roles:** `labAssistant` (own labs only), `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Software uninstalled from PC"
}
```

---

## 5. Classes & Courses

### GET `/api/courses`
Get all courses.

**Roles:** All authenticated

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "crs-001",
      "name": "Database Management Systems",
      "code": "CS401",
      "credits": 4
    },
    {
      "id": "crs-002",
      "name": "Operating Systems",
      "code": "CS402",
      "credits": 4
    }
  ],
  "total": 8
}
```

---

### POST `/api/courses`
Create a new course.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "name": "Machine Learning",
  "code": "CS501",
  "credits": 4
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "crs-009",
    "name": "Machine Learning",
    "code": "CS501",
    "credits": 4
  },
  "message": "Course created successfully"
}
```

---

### GET `/api/classes`
Get all classes.

**Roles:** All authenticated

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cls-001",
      "name": "SE-A",
      "courseId": "crs-001",
      "courseName": "Database Management Systems",
      "semester": 4,
      "strength": 60
    },
    {
      "id": "cls-002",
      "name": "SE-B",
      "courseId": "crs-001",
      "courseName": "Database Management Systems",
      "semester": 4,
      "strength": 58
    }
  ],
  "total": 5
}
```

---

### POST `/api/classes`
Create a new class.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "name": "TE-A",
  "courseId": "crs-002",
  "semester": 5,
  "strength": 62
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "cls-006",
    "name": "TE-A",
    "courseId": "crs-002",
    "courseName": "Operating Systems",
    "semester": 5,
    "strength": 62
  },
  "message": "Class created successfully"
}
```

---

### PUT `/api/classes/:id`
Update a class.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "strength": 65,
  "semester": 5
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cls-006",
    "name": "TE-A",
    "courseId": "crs-002",
    "courseName": "Operating Systems",
    "semester": 5,
    "strength": 65
  },
  "message": "Class updated successfully"
}
```

---

### DELETE `/api/classes/:id`
Delete a class.

**Roles:** `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Class deleted successfully"
}
```

---

## 6. Faculty

### GET `/api/faculty`
Get all faculty members.

**Roles:** All authenticated

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fac-001",
      "name": "Dr. Anjali Mehta",
      "email": "anjali.mehta@pccoepune.org",
      "phone": "9876543210",
      "department": "Computer Engineering",
      "courses": [
        { "id": "crs-001", "name": "Database Management Systems", "code": "CS401" }
      ]
    }
  ],
  "total": 5
}
```

---

### POST `/api/faculty`
Add a new faculty member.

**Roles:** `admin`

**Request:**
```json
{
  "name": "Prof. Suresh Kumar",
  "email": "suresh.kumar@pccoepune.org",
  "phone": "9123456789",
  "department": "Computer Engineering",
  "courseIds": ["crs-002", "crs-003"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "fac-006",
    "name": "Prof. Suresh Kumar",
    "email": "suresh.kumar@pccoepune.org",
    "phone": "9123456789",
    "department": "Computer Engineering",
    "courses": [
      { "id": "crs-002", "name": "Operating Systems", "code": "CS402" },
      { "id": "crs-003", "name": "Computer Networks", "code": "CS403" }
    ]
  },
  "message": "Faculty added successfully"
}
```

---

### PUT `/api/faculty/:id`
Update faculty details.

**Roles:** `faculty` (own record only), `admin`

**Request:**
```json
{
  "phone": "9999999999",
  "department": "Information Technology",
  "courseIds": ["crs-001"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "fac-001",
    "name": "Dr. Anjali Mehta",
    "email": "anjali.mehta@pccoepune.org",
    "phone": "9999999999",
    "department": "Information Technology",
    "courses": [
      { "id": "crs-001", "name": "Database Management Systems", "code": "CS401" }
    ]
  },
  "message": "Faculty updated successfully"
}
```

---

### DELETE `/api/faculty/:id`
Remove a faculty member.

**Roles:** `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Faculty removed successfully"
}
```

---

## 7. Timetable

### GET `/api/timetable`
Get timetable entries. Lab assistants see only their assigned labs' entries.

**Roles:** All authenticated  
**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `labNo` | string | Filter by lab number |
| `day` | string | Filter by day (`Mon`\|`Tue`\|`Wed`\|`Thu`\|`Fri`\|`Sat`) |
| `facultyId` | string | Filter by faculty |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tt-001",
      "labNo": "6101",
      "labName": "Computer Lab 6101",
      "classId": "cls-001",
      "className": "SE-A",
      "courseId": "crs-001",
      "courseName": "Database Management Systems",
      "facultyId": "fac-001",
      "facultyName": "Dr. Anjali Mehta",
      "dayOfWeek": "Mon",
      "startTime": "09:00",
      "endTime": "11:00"
    }
  ],
  "total": 8
}
```

---

### POST `/api/timetable`
Create a new timetable entry.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "labNo": "6101",
  "classId": "cls-001",
  "courseId": "crs-001",
  "facultyId": "fac-001",
  "dayOfWeek": "Wed",
  "startTime": "11:00",
  "endTime": "13:00"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "tt-009",
    "labNo": "6101",
    "labName": "Computer Lab 6101",
    "classId": "cls-001",
    "className": "SE-A",
    "courseId": "crs-001",
    "courseName": "Database Management Systems",
    "facultyId": "fac-001",
    "facultyName": "Dr. Anjali Mehta",
    "dayOfWeek": "Wed",
    "startTime": "11:00",
    "endTime": "13:00"
  },
  "message": "Timetable entry created"
}
```

**Response `409` (Conflict):**
```json
{
  "success": false,
  "error": "Lab 6101 is already booked on Wed 11:00–13:00",
  "statusCode": 409
}
```

---

### PUT `/api/timetable/:id`
Update a timetable entry.

**Roles:** `faculty`, `admin`

**Request:**
```json
{
  "dayOfWeek": "Thu",
  "startTime": "14:00",
  "endTime": "16:00"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "tt-009",
    "labNo": "6101",
    "labName": "Computer Lab 6101",
    "classId": "cls-001",
    "className": "SE-A",
    "courseId": "crs-001",
    "courseName": "Database Management Systems",
    "facultyId": "fac-001",
    "facultyName": "Dr. Anjali Mehta",
    "dayOfWeek": "Thu",
    "startTime": "14:00",
    "endTime": "16:00"
  },
  "message": "Timetable entry updated"
}
```

---

### DELETE `/api/timetable/:id`
Delete a timetable entry.

**Roles:** `faculty`, `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Timetable entry deleted"
}
```

---

## 8. Lab Assistants (Admin)

### GET `/api/assistants`
Get all lab assistants.

**Roles:** `admin`

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by name or email |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "asst-001",
      "name": "Raj Patel",
      "email": "rajpatel@pccoepune.org",
      "assignedLabs": ["6101", "6102", "6103"],
      "createdDate": "2024-01-15"
    },
    {
      "id": "asst-002",
      "name": "Priya Sharma",
      "email": "priyasharma@pccoepune.org",
      "assignedLabs": ["6104", "6105"],
      "createdDate": "2024-01-20"
    }
  ],
  "total": 3
}
```

---

### POST `/api/assistants`
Create a new lab assistant account.

**Roles:** `admin`

**Request:**
```json
{
  "name": "John Doe",
  "email": "johndoe@pccoepune.org",
  "password": "initialpassword123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "asst-004",
    "name": "John Doe",
    "email": "johndoe@pccoepune.org",
    "assignedLabs": [],
    "createdDate": "2026-03-17"
  },
  "message": "Lab assistant created successfully"
}
```

**Response `409`:**
```json
{
  "success": false,
  "error": "Email already registered",
  "statusCode": 409
}
```

---

### PUT `/api/assistants/:id`
Update assistant details.

**Roles:** `admin`

**Request:**
```json
{
  "name": "John D. Updated",
  "phone": "9876543210"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "asst-004",
    "name": "John D. Updated",
    "email": "johndoe@pccoepune.org",
    "assignedLabs": [],
    "createdDate": "2026-03-17"
  },
  "message": "Assistant updated successfully"
}
```

---

### DELETE `/api/assistants/:id`
Delete a lab assistant. All their lab assignments are also removed.

**Roles:** `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Assistant removed and all lab assignments cleared"
}
```

---

## 9. Users / Settings

### PUT `/api/users/me/password`
Change the current user's password.

**Roles:** Any authenticated

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response `401`:**
```json
{
  "success": false,
  "error": "Current password is incorrect",
  "statusCode": 401
}
```

---

### PUT `/api/users/me/preferences`
Update user display preferences.

**Roles:** Any authenticated

**Request:**
```json
{
  "darkMode": false,
  "emailNotifications": true,
  "pushNotifications": false,
  "twoFactorEnabled": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "darkMode": false,
    "emailNotifications": true,
    "pushNotifications": false,
    "twoFactorEnabled": false
  },
  "message": "Preferences updated"
}
```

---

### GET `/api/dashboard/stats`
Get summary stats for the dashboard.

**Roles:** All authenticated (response filtered by role)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalLabs": 60,
    "accessibleLabs": 3,
    "totalPCs": 900,
    "activePCs": 756,
    "maintenancePCs": 90,
    "inactivePCs": 54,
    "totalSoftware": 14,
    "totalClasses": 5,
    "totalFaculty": 5,
    "upcomingSlots": 3
  }
}
```

---

## 10. Standard Response Envelope

Every response follows this consistent structure:

**Success (single object):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Success (list):**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 60,
  "page": 1,
  "pageSize": 50
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request (missing/invalid fields) |
| `401` | Unauthorized (no/invalid token) |
| `403` | Forbidden (valid token but insufficient role) |
| `404` | Not Found |
| `409` | Conflict (duplicate entry, scheduling clash) |
| `500` | Internal Server Error |

---

## 11. Role Permission Matrix

| Endpoint Group | student | labAssistant | faculty | admin |
|----------------|---------|-------------|---------|-------|
| Auth (login/logout/me) | ✅ | ✅ | ✅ | ✅ |
| GET /labs | ❌ | ✅ own only | ✅ | ✅ |
| POST/PUT/DELETE /labs | ❌ | ❌ | ❌ | ✅ |
| PUT /labs/:id/assign | ❌ | ❌ | ❌ | ✅ |
| GET /labs/:id/pcs | ❌ | ✅ own only | ✅ | ✅ |
| POST /pcs | ❌ | ❌ | ✅ | ✅ |
| PUT /pcs/:id | ❌ | ✅ own only | ✅ | ✅ |
| DELETE /pcs/:id | ❌ | ❌ | ✅ | ✅ |
| GET /software | ✅ | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /software | ❌ | ✅ | ✅ | ✅ |
| GET /classes & /courses | ✅ | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /classes | ❌ | ❌ | ✅ | ✅ |
| GET /faculty | ✅ | ✅ | ✅ | ✅ |
| POST/DELETE /faculty | ❌ | ❌ | ❌ | ✅ |
| PUT /faculty/:id | ❌ | ❌ | ✅ own | ✅ |
| GET /timetable | ✅ | ✅ own only | ✅ | ✅ |
| POST/PUT/DELETE /timetable | ❌ | ❌ | ✅ | ✅ |
| GET/POST/PUT/DELETE /assistants | ❌ | ❌ | ❌ | ✅ |
| PUT /users/me/password | ✅ | ✅ | ✅ | ✅ |
| GET /dashboard/stats | ✅ | ✅ | ✅ | ✅ |

---

## 12. Database Table Summary

Suggested SQL tables for Flask-SQLAlchemy:

```sql
users          (id, name, email, password_hash, role, created_at)
labs           (id, lab_no UNIQUE, name, capacity, description)
pcs            (id, pc_no, lab_no FK, os, processor, ram, storage, gpu, status)
software       (id, name, version, category, install_date)
pc_software    (pc_id FK, software_id FK)             -- many-to-many
lab_assistants (id, user_id FK, created_date)
lab_assignments(lab_no FK, assistant_id FK, assigned_date)  -- which asst manages which lab
faculty        (id, user_id FK, phone, department)
faculty_courses(faculty_id FK, course_id FK)          -- many-to-many
courses        (id, name, code UNIQUE, credits)
classes        (id, name, course_id FK, semester, strength)
timetable      (id, lab_no FK, class_id FK, course_id FK, faculty_id FK, day_of_week, start_time, end_time)
```

> **Note:** `lab_assistants.user_id` and `faculty.user_id` both reference `users.id` — a single `users` table handles all roles. The `role` column in `users` controls access at the Flask route level via JWT claims.
