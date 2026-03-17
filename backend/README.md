# DBMS Project Backend (Boilerplate)

Minimal Flask backend scaffold prepared for CRUD development using raw SQL via psycopg2.

## What is included
- Flask app factory pattern
- Environment-based configuration
- psycopg2 database connection helper
- Labs routes wired under `/api`
- Models package placeholder

## Project structure
- `src/app.py`: app entrypoint + `create_app`
- `src/config.py`: environment/config classes
- `src/extensions.py`: PostgreSQL connection helpers (psycopg2)
- `src/routes/__init__.py`: blueprint registration
- `src/routes/labs.py`: labs endpoints
- `src/routes/assistant.py`: assistant-scoped labs and timetable endpoints
- `src/routes/faculty.py`: faculty-scoped labs and timetable endpoints
- `src/models/`: ORM models placeholder

## Setup
1. Create and activate a Python environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy env template and update values:
   ```bash
   cp .env.example .env
   ```
4. Start server from `src`:
   ```bash
   python app.py
   ```

## Implemented endpoints
- `GET /api/<college>/labs`
- `GET /api/<college>/labs/lab/<id>`
- `GET /api/<college>/labs/<pc>`
- `GET /api/<college>/assistant/labs`
- `GET /api/<college>/assistant/labs/<id>`
- `GET /api/<college>/faculty/labs`
- `GET /api/<college>/faculty/labs/<id>`

Response envelope follows the API spec (`success`, `data`, etc.).

## Temporary actor identity input
- Assistant endpoints currently accept `X-Assistant-Id` header or `assistantId` query param.
- Faculty endpoints currently accept `X-Faculty-Id` header or `facultyId` query param.

These are temporary placeholders until JWT auth middleware is added.
