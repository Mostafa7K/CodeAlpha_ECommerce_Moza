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

async function handleResponse(response) {
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
