// Authentication helpers — talk to the backend's cookie-based JWT auth endpoints.

import { api, ApiError } from './api.js';

export async function getCurrentUser() {
  try {
    const data = await api.get('/auth/me');
    return data.user;
  } catch (err) {
    return null;
  }
}

export async function register({ name, email, password }) {
  const data = await api.post('/auth/register', { name, email, password });
  return data.user;
}

export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email, password });
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}

export { ApiError };
