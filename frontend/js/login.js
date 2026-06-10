// Login page — submits credentials to the API and redirects on success.

import { login, ApiError } from './auth.js';

const form = document.getElementById('login-form');
const alertEl = document.getElementById('form-alert');
const submitBtn = document.getElementById('submit-btn');

function showError(message) {
  alertEl.innerHTML = `<div class="alert alert-error mb-2"><span>${message}</span></div>`;
}

function clearAlert() {
  alertEl.innerHTML = '';
}

function getRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || 'index.html';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showError('Please enter both your email and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    await login({ email, password });
    window.location.href = getRedirectTarget();
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Unable to log in. Please try again.';
    showError(message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
});
