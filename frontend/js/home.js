// Home page — fetches and renders the product listing grid.

import { api, ApiError } from './api.js';
import { formatCurrency, escapeHtml } from './format.js';
import { addToCart, onCartChange, getCart } from './cart.js';

const productListEl = document.getElementById('product-list');

function stockBadge(stock) {
  if (stock <= 0) {
    return '<span class="badge badge-destructive">Out of Stock</span>';
  }
  if (stock <= 5) {
    return `<span class="badge badge-warning">Only ${stock} left</span>`;
  }
  return '<span class="badge badge-success">In Stock</span>';
}

function getQuantityInCart(productId) {
  const item = getCart().find((entry) => entry.id === productId);
  return item ? item.quantity : 0;
}

function renderProducts(products) {
  if (products.length === 0) {
    productListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🕯️</div>
        <h3>No candles available right now</h3>
        <p>Please check back soon — new scents are on the way.</p>
      </div>
    `;
    return;
  }

  productListEl.innerHTML = `
    <div class="product-grid">
      ${products.map((product) => {
        const outOfStock = product.stock_quantity <= 0;
        const inCart = getQuantityInCart(product.id);
        const atLimit = inCart >= product.stock_quantity;

        return `
          <div class="product-card">
            <a href="product.html?id=${product.id}" class="product-card-media">
              <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" loading="lazy" />
            </a>
            <div class="product-card-body">
              <div class="product-card-title-row">
                <a href="product.html?id=${product.id}">
                  <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
                </a>
                <span class="product-card-price">${formatCurrency(product.price)}</span>
              </div>
              <p class="product-card-desc">${escapeHtml(product.description)}</p>
              <div class="product-card-meta">
                ${stockBadge(product.stock_quantity)}
                <span class="badge badge-outline">${escapeHtml(product.burn_time)}</span>
              </div>
            </div>
            <div class="product-card-actions">
              <a href="product.html?id=${product.id}" class="btn btn-outline btn-block">View Details</a>
              <button
                class="btn btn-primary btn-block add-to-cart-btn"
                data-id="${product.id}"
                ${(outOfStock || atLimit) ? 'disabled' : ''}
              >
                ${outOfStock ? 'Out of Stock' : (atLimit ? 'Max in Cart' : 'Add to Cart')}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  productListEl.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number(button.dataset.id);
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      addToCart(product, 1);
      renderProducts(products);
    });
  });
}

async function loadProducts() {
  try {
    const data = await api.get('/products');
    renderProducts(data.products);

    onCartChange(() => renderProducts(data.products));
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Unable to load candles. Please make sure the API server is running.';
    productListEl.innerHTML = `
      <div class="alert alert-error">
        <span>${message}</span>
      </div>
    `;
  }
}

loadProducts();
