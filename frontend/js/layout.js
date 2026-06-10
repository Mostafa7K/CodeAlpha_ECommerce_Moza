// Renders the shared site header and footer into every page, keeps the cart
// badge in sync, and reflects the current authentication state in the nav.

import { getCartCount, onCartChange } from './cart.js';
import { getCurrentUser, logout } from './auth.js';

const NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'index.html#shop', label: 'Shop' },
  { href: 'cart.html', label: 'Cart' }
];

function buildHeader() {
  const currentPage = document.body.dataset.page || '';

  const links = NAV_LINKS.map((link) => {
    const isActive = link.href.startsWith(currentPage) && currentPage !== '';
    return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
  }).join('');

  return `
    <div class="container navbar">
      <a href="index.html" class="brand">
        <span class="brand-mark">M</span>
        <span>Moza</span>
      </a>
      <nav class="nav-links">
        ${links}
      </nav>
      <div class="nav-actions">
        <div class="user-menu" id="user-menu"></div>
        <a href="cart.html" class="cart-button" aria-label="View cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span class="cart-badge hidden" id="cart-badge">0</span>
        </a>
      </div>
    </div>
  `;
}

function buildFooter() {
  const year = new Date().getFullYear();

  return `
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="index.html" class="brand">
          <span class="brand-mark">M</span>
          <span>Moza</span>
        </a>
        <p>Small-batch, hand-poured candles made with natural soy wax and thoughtfully chosen fragrance oils.</p>
      </div>
      <div>
        <h4>Shop</h4>
        <ul>
          <li><a href="index.html#shop">All Candles</a></li>
          <li><a href="cart.html">Your Cart</a></li>
        </ul>
      </div>
      <div>
        <h4>Account</h4>
        <ul id="footer-account-links">
          <li><a href="login.html">Log In</a></li>
          <li><a href="register.html">Create Account</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>&copy; ${year} Moza Candle Co. All rights reserved.</span>
      <span>Hand-poured with care.</span>
    </div>
  `;
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = String(count);
  badge.classList.toggle('hidden', count === 0);
}

async function updateUserMenu() {
  const userMenu = document.getElementById('user-menu');
  const footerAccountLinks = document.getElementById('footer-account-links');
  if (!userMenu) return;

  const user = await getCurrentUser();

  if (user) {
    userMenu.innerHTML = `
      <span>Hi, ${user.name.split(' ')[0]}</span>
      <button class="btn btn-ghost btn-sm" id="logout-btn">Log Out</button>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await logout();
      window.location.href = 'index.html';
    });

    if (footerAccountLinks) {
      footerAccountLinks.innerHTML = `<li>${user.email}</li>`;
    }
  } else {
    userMenu.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm">Log In</a>
      <a href="register.html" class="btn btn-secondary btn-sm">Sign Up</a>
    `;
  }
}

export function renderLayout() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  if (header) header.innerHTML = buildHeader();
  if (footer) footer.innerHTML = buildFooter();

  updateCartBadge();
  updateUserMenu();

  onCartChange(updateCartBadge);
}

document.addEventListener('DOMContentLoaded', renderLayout);
