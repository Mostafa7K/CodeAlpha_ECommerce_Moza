// Registration page — validates input client-side, then submits to the API.

import { register, ApiError } from './auth.js';

const form = document.getElementById('register-form');
const alertEl = document.getElementById('form-alert');
const submitBtn = document.getElementById('submit-btn');

function showError(message) {
  alertEl.innerHTML = `<div class="alert alert-error mb-2"><span>${message}</span></div>`;
}

function clearAlert() {
  alertEl.innerHTML = '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (name.length < 2) {
    showError('Please enter your full name.');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    await register({ name, email, password });
    window.location.href = 'index.html';
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.';
    showError(message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
});
