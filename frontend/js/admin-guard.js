// Restricts access to the admin dashboard to the two allowlisted accounts.
// Runs as an ES module, so it executes after the inline FOUC-prevention
// script but before the page is revealed (see admin.html's CSS gate).

import { getCurrentUser } from './auth.js';

const ADMIN_EMAILS = ['most.kanaan7@gmail.com', 'zeinabajrouche123@gmail.com'];

export async function guardAdminPage() {
  const user = await getCurrentUser();
  const email = user?.email?.toLowerCase();

  if (!user || !ADMIN_EMAILS.includes(email)) {
    window.location.replace('index.html');
    return null;
  }

  document.documentElement.classList.add('admin-authorized');
  return user;
}
