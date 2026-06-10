// Checkout page — requires authentication, reviews the cart, submits the
// order to the backend within a single transaction, and renders a
// confirmation summary on success.

import { api, ApiError } from './api.js';
import { formatCurrency, escapeHtml } from './format.js';
import { getCart, getCartSubtotal, clearCart } from './cart.js';
import { getCurrentUser } from './auth.js';

const checkoutContentEl = document.getElementById('checkout-content');

const SHIPPING_FLAT_RATE = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

function renderLoggedOut() {
  checkoutContentEl.innerHTML = `
    <div class="card">
      <div class="card-content">
        <div class="alert alert-info mb-2">
          <span>Please log in to your Moza account to complete checkout.</span>
        </div>
        <a href="login.html?redirect=checkout.html" class="btn btn-primary">Log In to Continue</a>
      </div>
    </div>
  `;
}

function renderEmptyCart() {
  checkoutContentEl.innerHTML = `
    <div class="empty-state card">
      <div class="empty-state-icon">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Add a few candles to your cart before checking out.</p>
      <a href="index.html#shop" class="btn btn-primary">Browse Candles</a>
    </div>
  `;
}

function renderReview(cart, user) {
  const subtotal = getCartSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = subtotal + shipping;

  checkoutContentEl.innerHTML = `
    <div class="checkout-layout">
      <div class="card card-content">
        <h3 class="card-title mb-2">Items in your order</h3>
        <div class="cart-items">
          ${cart.map((item) => `
            <div class="cart-item" style="grid-template-columns: 70px 1fr auto; padding: 0.75rem 0; border-bottom: 1px solid hsl(var(--border));">
              <div class="cart-item-media" style="width:70px; height:70px;">
                <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" />
              </div>
              <div class="cart-item-info">
                <span class="cart-item-title">${escapeHtml(item.name)}</span>
                <span class="cart-item-price">${formatCurrency(item.price)} &times; ${item.quantity}</span>
              </div>
              <span class="cart-item-line-total">${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <h3 class="card-title mt-3 mb-1">Shipping To</h3>
        <p class="form-hint">${escapeHtml(user.name)} &mdash; ${escapeHtml(user.email)}</p>
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
        <div class="summary-row total">
          <span>Total</span>
          <span>${formatCurrency(total)}</span>
        </div>

        <div id="order-error"></div>

        <button class="btn btn-primary btn-lg btn-block mt-2" id="place-order-btn">
          Place Order
        </button>
      </div>
    </div>
  `;

  document.getElementById('place-order-btn').addEventListener('click', async () => {
    await placeOrder(cart);
  });
}

function renderConfirmation(order) {
  checkoutContentEl.innerHTML = `
    <div class="card order-confirmation">
      <div class="check-icon">&#10003;</div>
      <h2>Order Placed!</h2>
      <p>Thank you for shopping with Moza. Your order #${order.id} has been received and is now <strong>${escapeHtml(order.status)}</strong>.</p>

      <div class="card confirmation-summary card-content">
        ${order.items.map((item) => `
          <div class="confirmation-line">
            <span>${escapeHtml(item.name)} &times; ${item.quantity}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
          </div>
        `).join('')}
        <div class="confirmation-line" style="border-bottom:none; font-weight:700;">
          <span>Total</span>
          <span>${formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <a href="index.html#shop" class="btn btn-primary btn-lg">Continue Shopping</a>
    </div>
  `;
}

async function placeOrder(cart) {
  const errorEl = document.getElementById('order-error');
  const placeOrderBtn = document.getElementById('place-order-btn');

  errorEl.innerHTML = '';
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = 'Placing Order...';

  try {
    const items = cart.map((item) => ({ productId: item.id, quantity: item.quantity }));
    const data = await api.post('/orders', { items });

    clearCart();
    renderConfirmation(data.order);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Something went wrong while placing your order.';
    errorEl.innerHTML = `<div class="alert alert-error mb-2"><span>${message}</span></div>`;
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place Order';
  }
}

async function init() {
  const user = await getCurrentUser();

  if (!user) {
    renderLoggedOut();
    return;
  }

  const cart = getCart();

  if (cart.length === 0) {
    renderEmptyCart();
    return;
  }

  renderReview(cart, user);
}

init();
