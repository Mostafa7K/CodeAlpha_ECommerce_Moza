// Product detail page — fetches a single product by id and handles
// the quantity selector + add-to-cart interaction.

import { api, ApiError } from './api.js';
import { formatCurrency, escapeHtml } from './format.js';
import { addToCart, getCart } from './cart.js';

const detailEl = document.getElementById('product-detail');

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id && /^\d+$/.test(id) ? Number(id) : null;
}

function stockBadge(stock) {
  if (stock <= 0) {
    return '<span class="badge badge-destructive">Out of Stock</span>';
  }
  if (stock <= 5) {
    return `<span class="badge badge-warning">Only ${stock} left in stock</span>`;
  }
  return '<span class="badge badge-success">In Stock</span>';
}

function renderError(message) {
  detailEl.innerHTML = `
    <div class="alert alert-error">
      <span>${message}</span>
    </div>
    <div class="mt-3">
      <a href="index.html" class="btn btn-outline">&larr; Back to all candles</a>
    </div>
  `;
}

function renderProduct(product) {
  const inCart = getCart().find((item) => item.id === product.id);
  const inCartQuantity = inCart ? inCart.quantity : 0;
  const remaining = Math.max(product.stock_quantity - inCartQuantity, 0);
  const outOfStock = product.stock_quantity <= 0;

  detailEl.innerHTML = `
    <a href="index.html" class="btn btn-ghost btn-sm mb-3">&larr; Back to all candles</a>

    <div class="product-detail">
      <div class="product-detail-media">
        <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" />
      </div>

      <div class="product-detail-info">
        <div>
          ${stockBadge(product.stock_quantity)}
          <h1>${escapeHtml(product.name)}</h1>
        </div>

        <div class="product-detail-price">${formatCurrency(product.price)}</div>

        <p class="product-detail-desc">${escapeHtml(product.description)}</p>

        <div class="product-meta-list">
          <div class="product-meta-item">
            <span class="product-meta-label">Burn Time</span>
            <span class="product-meta-value">${escapeHtml(product.burn_time)}</span>
          </div>
          <div class="product-meta-item">
            <span class="product-meta-label">Stock Available</span>
            <span class="product-meta-value">${product.stock_quantity} units</span>
          </div>
          <div class="product-meta-item">
            <span class="product-meta-label">Wax Type</span>
            <span class="product-meta-value">Natural Soy Blend</span>
          </div>
          <div class="product-meta-item">
            <span class="product-meta-label">Vessel</span>
            <span class="product-meta-value">Reusable Glass Jar</span>
          </div>
        </div>

        <div class="product-actions-row">
          <div class="quantity-selector">
            <button type="button" id="qty-decrease" aria-label="Decrease quantity">&minus;</button>
            <input type="number" id="qty-input" value="1" min="1" max="${remaining}" ${outOfStock ? 'disabled' : ''} />
            <button type="button" id="qty-increase" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn-primary btn-lg" id="add-to-cart-btn" ${outOfStock || remaining <= 0 ? 'disabled' : ''}>
            ${outOfStock ? 'Out of Stock' : (remaining <= 0 ? 'Max in Cart' : 'Add to Cart')}
          </button>
          <span id="add-to-cart-feedback" class="form-hint hidden">Added to cart!</span>
        </div>
      </div>
    </div>
  `;

  const qtyInput = document.getElementById('qty-input');
  const decreaseBtn = document.getElementById('qty-decrease');
  const increaseBtn = document.getElementById('qty-increase');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const feedback = document.getElementById('add-to-cart-feedback');

  decreaseBtn?.addEventListener('click', () => {
    const value = Math.max(1, Number(qtyInput.value) - 1);
    qtyInput.value = String(value);
  });

  increaseBtn?.addEventListener('click', () => {
    const value = Math.min(remaining, Number(qtyInput.value) + 1);
    qtyInput.value = String(value);
  });

  qtyInput?.addEventListener('change', () => {
    let value = Number(qtyInput.value) || 1;
    value = Math.min(Math.max(value, 1), Math.max(remaining, 1));
    qtyInput.value = String(value);
  });

  addToCartBtn?.addEventListener('click', () => {
    const quantity = Number(qtyInput.value) || 1;
    addToCart(product, quantity);

    feedback?.classList.remove('hidden');
    setTimeout(() => feedback?.classList.add('hidden'), 2000);

    renderProduct(product);
  });
}

async function loadProduct() {
  const productId = getProductIdFromUrl();

  if (!productId) {
    renderError('No candle was specified. Please choose one from our collection.');
    return;
  }

  try {
    const data = await api.get(`/products/${productId}`);
    document.title = `${data.product.name} — Moza`;
    renderProduct(data.product);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      renderError('We could not find that candle. It may have been removed from our collection.');
    } else {
      renderError('Unable to load this candle right now. Please make sure the API server is running.');
    }
  }
}

loadProduct();
