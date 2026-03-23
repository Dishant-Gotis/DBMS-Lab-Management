/**
 * Centralised API client for the DBMS Lab Management backend.
 *
 * Base URL: /api  (proxied to http://localhost:5000 by Vite during dev)
 *
 * College slug — default is "1" (numeric ID of PCCOE Pune from seed data).
 * Can later be read from AuthContext or an env var once multi-college auth lands.
 */

const BASE = '/api';
export const COLLEGE = '1'; // default college for all requests

// ── Response shapes from the backend ──────────────────────────────────────────

export interface ApiLab {
  id: number;
  labNo: string;
  name: string;
  floor: number;
  assignedAssistantId: number | null;
  assignedAssistantName: string | null;
}

export interface ApiLabsResponse {
  success: boolean;
  data: ApiLab[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiSoftware {
  id: number;
  name: string;
  version: string | null;
  installedAt: string;
}

export interface ApiPCDetails {
  id: number;
  password: string;
  osId: number;
  osName: string;
  osVersion: string;
  specDescription: string | null;
}

export interface ApiPCDetailsResponse {
  success: boolean;
  data: {
    college: { id: number; name: string };
    pc: ApiPCDetails;
    softwares: ApiSoftware[];
  };
}

export interface ApiLabDetail {
  id: number;
  labNo: string;
  name: string;
  floor: number;
  assignedAssistantId: number | null;
  assignedAssistantName: string | null;
}

export interface ApiAdminPc extends ApiPCDetails {
  pcNo: string | null;
  status: string | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  softwares: ApiSoftware[];
}

export interface ApiLabDetailResponse {
  success: boolean;
  data: ApiLabDetail;
}

export interface ApiAssistant {
  id: number;
  name: string;
  email: string;
  phone: string;
  assignedLabNo: string | null;
}

export interface ApiFaculty {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// ── Generic fetch helper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });

  // Gracefully handle non-JSON bodies (e.g. 502 proxy error returns HTML)
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`Backend unreachable (HTTP ${res.status}). Is the Flask server running?`);
    }
    throw new Error(`Unexpected non-JSON response from the server (HTTP ${res.status}).`);
  }

  if (!res.ok || !json['success']) {
    const message = (json['error'] as string) ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json as T;
}

// ── Public API helpers ─────────────────────────────────────────────────────────

/**
 * Fetch paginated list of labs for a college.
 * @param college  College slug or numeric ID. Default: COLLEGE constant.
 * @param q        Optional search query.
 */
export async function fetchLabs(
  college: string = COLLEGE,
  q = '',
  page = 1,
  pageSize = 100,
): Promise<ApiLab[]> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  const data = await apiFetch<ApiLabsResponse>(`/${college}/labs?${params}`);
  return data.data;
}

/**
 * Fetch a single lab by its numeric DB id.
 */
export async function fetchLabById(
  labId: number | string,
  college: string = COLLEGE,
): Promise<ApiLabDetail> {
  const data = await apiFetch<ApiLabDetailResponse>(`/${college}/labs/lab/${labId}`);
  return data.data;
}

/**
 * Fetch a single PC's details + installed software list.
 */
export async function fetchPcDetails(
  pcId: number | string,
  college: string = COLLEGE,
): Promise<ApiPCDetailsResponse['data']> {
  const data = await apiFetch<ApiPCDetailsResponse>(`/${college}/labs/${pcId}`);
  return data.data;
}

/**
 * Fetch labs assigned to the current lab assistant.
 * Uses placeholder header auth as per backend spec.
 */
export async function fetchAssistantLabs(
  assistantId: string,
  college: string = COLLEGE,
): Promise<ApiLab[]> {
  const data = await apiFetch<ApiLabsResponse>(`/${college}/assistant/labs`, {
    headers: {
      'X-Role': 'assistant',
      'X-Assistant-Id': assistantId,
    },
  });
  return data.data;
}

/**
 * Fetch labs where this faculty member appears in the timetable.
 * Uses placeholder header auth as per backend spec.
 */
export async function fetchFacultyLabs(
  facultyId: string,
  college: string = COLLEGE,
): Promise<ApiLab[]> {
  const data = await apiFetch<ApiLabsResponse>(`/${college}/faculty/labs`, {
    headers: {
      'X-Role': 'faculty',
      'X-Faculty-Id': facultyId,
    },
  });
  return data.data;
}

/**
 * Admin: Create a new lab via the seed endpoint.
 */
export async function createLab(
  floor: number,
  name?: string,
  college: string = COLLEGE,
): Promise<ApiLab> {
  const data = await apiFetch<any>(`/${college}/admin/labs`, {
    method: 'POST',
    headers: {
      'X-Role': 'admin',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ floor, name }),
  });
  return data.data;
}

/**
 * Admin: Fetch all PCs in a specific lab.
 */
export async function fetchAdminLabPcs(
  labId: number,
  college: string = COLLEGE,
): Promise<ApiAdminPc[]> {
  const data = await apiFetch<any>(`/${college}/admin/labs/${labId}/pcs`, {
    headers: { 'X-Role': 'admin' },
  });
  return data.data;
}

/**
 * Admin: Create a new PC in a lab with hardware specs.
 */
export async function createAdminLabPc(
  labId: number,
  password: string,
  osId: number,
  pcNo?: string,
  status?: string,
  processor?: string,
  ram?: string,
  storage?: string,
  college: string = COLLEGE,
): Promise<ApiAdminPc> {
  const data = await apiFetch<any>(`/${college}/admin/labs/${labId}/pcs`, {
    method: 'POST',
    headers: { 'X-Role': 'admin', 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, os_id: osId, pcNo, status, processor, ram, storage }),
  });
  return data.data;
}

/**
 * Admin: Install software onto a specific PC.
 */
export async function installAdminPcSoftware(
  pcId: number,
  name: string,
  version?: string,
  college: string = COLLEGE,
): Promise<ApiSoftware> {
  const data = await apiFetch<any>(`/${college}/admin/pcs/${pcId}/software`, {
    method: 'POST',
    headers: { 'X-Role': 'admin', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, version }),
  });
  return data.data;
}

/**
 * Admin: Delete a specific lab and all its PCs.
 */
export async function deleteAdminLab(
  labId: number,
  college: string = COLLEGE,
): Promise<void> {
  await apiFetch<any>(`/${college}/admin/labs/${labId}`, {
    method: 'DELETE',
    headers: { 'X-Role': 'admin' },
  });
}

/**
 * Admin: Delete a specific PC from a lab.
 */
export async function deleteAdminLabPc(
  labId: number,
  pcId: number,
  college: string = COLLEGE,
): Promise<void> {
  await apiFetch<any>(`/${college}/admin/labs/${labId}/pcs/${pcId}`, {
    method: 'DELETE',
    headers: { 'X-Role': 'admin' },
  });
}

/**
 * Admin: Delete a specific software installation.
 */
export async function deleteAdminPcSoftware(
  swId: number,
  college: string = COLLEGE,
): Promise<void> {
  await apiFetch<any>(`/${college}/admin/software/${swId}`, {
    method: 'DELETE',
    headers: { 'X-Role': 'admin' },
  });
}

/**
 * Admin: Fetch all assistants.
 */
export async function fetchAdminAssistants(
  college: string = COLLEGE,
): Promise<ApiAssistant[]> {
  const data = await apiFetch<any>(`/${college}/admin/assistants`, {
    headers: { 'X-Role': 'admin' },
  });
  return data.data;
}

/**
 * Admin: Create an assistant.
 */
export async function createAdminAssistant(
  payload: { name: string; email: string; password: string; phone?: string; labId?: number },
  college: string = COLLEGE,
): Promise<ApiAssistant> {
  const data = await apiFetch<any>(`/${college}/admin/assistants`, {
    method: 'POST',
    headers: { 'X-Role': 'admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return data.data;
}

/**
 * Admin: Delete an assistant.
 */
export async function deleteAdminAssistant(
  id: number,
  college: string = COLLEGE,
): Promise<void> {
  await apiFetch<any>(`/${college}/admin/assistants/${id}`, {
    method: 'DELETE',
    headers: { 'X-Role': 'admin' },
  });
}

/**
 * Admin: Assign lab to assistant.
 */
export async function assignAdminAssistantLab(
  assistantId: number,
  labId: number,
  college: string = COLLEGE,
): Promise<void> {
  await apiFetch<any>(`/${college}/admin/assistants/${assistantId}/assign`, {
    method: 'PUT',
    headers: { 'X-Role': 'admin', 'Content-Type': 'application/json' },
    body: JSON.stringify({ labId }),
  });
}

/**
 * Admin: Fetch all faculty members.
 */
export async function fetchAdminFaculty(
  college: string = COLLEGE,
): Promise<ApiFaculty[]> {
  const data = await apiFetch<any>(`/${college}/admin/faculty`, {
    headers: { 'X-Role': 'admin' },
  });
  return data.data;
}

/**
 * Admin: Create a faculty member.
 */
export async function createAdminFaculty(
  payload: { name: string; email: string; password: string; phone?: string },
  college: string = COLLEGE,
): Promise<ApiFaculty> {
  const data = await apiFetch<any>(`/${college}/admin/faculty`, {
    method: 'POST',
    headers: { 'X-Role': 'admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return data.data;
}

/**
 * Admin: Delete a faculty member.
 */
export async function deleteAdminFaculty(
  id: number,
  college: string = COLLEGE,
): Promise<void> {
  await apiFetch<any>(`/${college}/admin/faculty/${id}`, {
    method: 'DELETE',
    headers: { 'X-Role': 'admin' },
  });
}
