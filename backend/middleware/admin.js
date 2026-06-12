// Restricts access to the admin dashboard API to a fixed allowlist of email
// addresses, configured via the ADMIN_EMAILS environment variable
// (comma-separated). Must be used after requireAuth.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(req, res, next) {
  const email = req.user?.email?.toLowerCase();

  if (!email || !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
}
