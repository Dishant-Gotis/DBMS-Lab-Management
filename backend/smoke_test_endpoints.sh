#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5000/api}"
COLLEGE="${COLLEGE:-1}"
ASSISTANT_ID="${ASSISTANT_ID:-1}"
FACULTY_ID="${FACULTY_ID:-1}"
LAB_ID="${LAB_ID:-1}"
PC_ID="${PC_ID:-1}"

echo "[1] GET ${BASE_URL}/${COLLEGE}/labs"
curl -sS "${BASE_URL}/${COLLEGE}/labs?q=&page=1&pageSize=50" | cat

echo
echo "[2] GET ${BASE_URL}/${COLLEGE}/labs/lab/${LAB_ID}"
curl -sS "${BASE_URL}/${COLLEGE}/labs/lab/${LAB_ID}" | cat

echo
echo "[3] GET ${BASE_URL}/${COLLEGE}/labs/${PC_ID}"
curl -sS "${BASE_URL}/${COLLEGE}/labs/${PC_ID}" | cat

echo
echo "[4] GET ${BASE_URL}/${COLLEGE}/assistant/labs"
curl -sS -H "X-Assistant-Id: ${ASSISTANT_ID}" "${BASE_URL}/${COLLEGE}/assistant/labs" | cat

echo
echo "[5] GET ${BASE_URL}/${COLLEGE}/assistant/labs/${LAB_ID}"
curl -sS -H "X-Assistant-Id: ${ASSISTANT_ID}" "${BASE_URL}/${COLLEGE}/assistant/labs/${LAB_ID}" | cat

echo
echo "[6] GET ${BASE_URL}/${COLLEGE}/faculty/labs"
curl -sS -H "X-Faculty-Id: ${FACULTY_ID}" "${BASE_URL}/${COLLEGE}/faculty/labs" | cat

echo
echo "[7] GET ${BASE_URL}/${COLLEGE}/faculty/labs/${LAB_ID}"
curl -sS -H "X-Faculty-Id: ${FACULTY_ID}" "${BASE_URL}/${COLLEGE}/faculty/labs/${LAB_ID}" | cat

echo
echo "Smoke test requests sent."
