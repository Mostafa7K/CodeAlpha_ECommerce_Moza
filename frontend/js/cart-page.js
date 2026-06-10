// Cart page — renders cart items from localStorage with quantity controls,
// removal, and a running subtotal/checkout summary.

import { formatCurrency, escapeHtml } from './format.js';
import { getCart, updateQuantity, removeFromCart, getCartSubtotal, onCartChange } from './cart.js';

const cartContentEl = document.getElementById('cart-content');

const SHIPPING_FLAT_RATE = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

function renderEmptyCart() {
  cartContentEl.innerHTML = `
    <div class="empty-state card">
      <div class="empty-state-icon">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added any candles yet.</p>
      <a href="index.html#shop" class="btn btn-primary">Browse Candles</a>
    </div>
  `;
}

function renderCart(cart) {
  if (cart.length === 0) {
    renderEmptyCart();
    return;
  }

  const subtotal = getCartSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = subtotal + shipping;

  cartContentEl.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${cart.map((item) => `
          <div class="cart-item card" data-id="${item.id}">
            <div class="cart-item-media">
              <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" />
            </div>
            <div class="cart-item-info">
              <a href="product.html?id=${item.id}" class="cart-item-title">${escapeHtml(item.name)}</a>
              <span class="cart-item-price">${formatCurrency(item.price)} each</span>
              <div class="cart-item-controls">
                <div class="quantity-selector">
                  <button type="button" class="qty-decrease" aria-label="Decrease quantity">&minus;</button>
                  <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.stock_quantity}" />
                  <button type="button" class="qty-increase" aria-label="Increase quantity">+</button>
                </div>
              </div>
            </div>
            <div class="cart-item-actions">
              <span class="cart-item-line-total">${formatCurrency(item.price * item.quantity)}</span>
              <button type="button" class="btn btn-ghost btn-sm remove-item-btn">Remove</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="cart-summary card card-content">
        <h3 class="card-title">Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>${shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
        </div>
        ${shipping > 0 ? `<p class="form-hint">Spend ${formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.</p>` : ''}
        <div class="summary-row total">
          <span>Total</span>
          <span>${formatCurrency(total)}</span>
        </div>
        <a href="checkout.html" class="btn btn-primary btn-lg btn-block mt-2">Checkout</a>
      </div>
    </div>
  `;

  cartContentEl.querySelectorAll('.cart-item').forEach((row) => {
    const productId = Number(row.dataset.id);
    const item = cart.find((entry) => entry.id === productId);
    if (!item) return;

    const qtyInput = row.querySelector('.qty-input');
    const decreaseBtn = row.querySelector('.qty-decrease');
    const increaseBtn = row.querySelector('.qty-increase');
    const removeBtn = row.querySelector('.remove-item-btn');

    decreaseBtn.addEventListener('click', () => {
      updateQuantity(productId, item.quantity - 1);
    });

    increaseBtn.addEventListener('click', () => {
      updateQuantity(productId, Math.min(item.quantity + 1, item.stock_quantity));
    });

    qtyInput.addEventListener('change', () => {
      let value = Number(qtyInput.value) || 1;
      value = Math.min(Math.max(value, 1), item.stock_quantity);
      updateQuantity(productId, value);
    });

    removeBtn.addEventListener('click', () => {
      removeFromCart(productId);
    });
  });
}

function refresh() {
  renderCart(getCart());
}

refresh();
onCartChange(refresh);
