// Light/dark theme toggle. The initial theme is applied synchronously by an
// inline script in <head> (see partials in each HTML page) to avoid a flash
// of the wrong theme before this module loads.

const STORAGE_KEY = 'moza-theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

const SUN_ICON = `
  <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
  </svg>
`;

const MOON_ICON = `
  <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
`;

export function themeToggleMarkup() {
  return `
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
      <span class="theme-toggle-thumb">
        ${SUN_ICON}
        ${MOON_ICON}
      </span>
    </button>
  `;
}

export function initThemeToggle() {
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  button.addEventListener('click', () => toggleTheme());
}
