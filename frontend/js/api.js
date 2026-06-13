// Centralized API client for the Moza storefront.
// All requests include credentials so the HttpOnly JWT cookie set by the
// backend is sent automatically with every request.

import { API_BASE_URL } from './config.js';

export { API_BASE_URL };

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Broadcast a connectivity/server problem so the shared layout can surface a
// non-intrusive banner. Decoupled via a window event so this client stays
// DOM-free and any page that loads the layout reacts automatically.
function notifyServerIssue(message) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('moza:server-error', { detail: { message } }));
  }
}

const OFFLINE_MESSAGE =
  'We can’t reach the Moza server right now. It may be waking up — please try again in a moment.';
const SERVER_ERROR_MESSAGE =
  'Something went wrong on our end. Please try again shortly.';

// Perform a fetch, converting a total network failure (DNS, CORS, or a sleeping
// backend) into a clean ApiError instead of an unhandled rejection.
async function safeFetch(url, init) {
  try {
    return await fetch(url, init);
  } catch (networkError) {
    notifyServerIssue(OFFLINE_MESSAGE);
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }
}

async function handleResponse(response) {
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    // Server-side faults get a global banner; client errors (4xx) are left to
    // the calling page to handle inline (e.g. "invalid password").
    if (response.status >= 500) {
      notifyServerIssue(data?.message || SERVER_ERROR_MESSAGE);
    }
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

async function request(path, options = {}) {
  const response = await safeFetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return handleResponse(response);
}

async function upload(path, formData, method = 'POST') {
  const response = await safeFetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    body: formData
  });

  return handleResponse(response);
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => upload(path, formData, 'POST'),
  uploadPut: (path, formData) => upload(path, formData, 'PUT')
};

export { ApiError };
