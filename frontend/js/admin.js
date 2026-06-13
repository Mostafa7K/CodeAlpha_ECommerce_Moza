// Admin dashboard logic — product inventory CRUD, orders view, and sales
// analytics. Access is enforced by admin-guard.js before this module runs.

import { guardAdminPage } from './admin-guard.js';
import { api, ApiError } from './api.js';
import { formatCurrency, escapeHtml } from './format.js';

const modal = document.getElementById('admin-modal');
const modalIcon = document.getElementById('admin-modal-icon');
const modalText = document.getElementById('admin-modal-text');
const modalClose = document.getElementById('admin-modal-close');

const form = document.getElementById('product-form');
const formTitle = document.getElementById('product-form-title');
const idField = document.getElementById('product-id');
const nameField = document.getElementById('product-name');
const descriptionField = document.getElementById('product-description');
const priceField = document.getElementById('product-price');
const stockField = document.getElementById('product-stock');
const burnTimeField = document.getElementById('product-burn-time');
const imageField = document.getElementById('product-image');
const imageHint = document.getElementById('image-hint');
const submitBtn = document.getElementById('product-submit-btn');
const cancelBtn = document.getElementById('product-cancel-btn');

const dropzone = document.getElementById('image-dropzone');
const dropzonePrompt = document.getElementById('dropzone-prompt');
const dropzonePreview = document.getElementById('dropzone-preview');
const dropzonePreviewImg = document.getElementById('dropzone-preview-img');
const dropzoneFilename = document.getElementById('dropzone-filename');
const dropzoneRemove = document.getElementById('dropzone-remove');
const imageError = document.getElementById('image-error');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const productsTableBody = document.getElementById('products-table-body');
const ordersTableBody = document.getElementById('orders-table-body');
const statRevenue = document.getElementById('stat-revenue');
const statOrders = document.getElementById('stat-orders');
const statLowStock = document.getElementById('stat-low-stock');
const lowStockList = document.getElementById('low-stock-list');
const topSellingList = document.getElementById('top-selling-list');

const MODAL_ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
};

// Shows a centered modal (with a blurred backdrop) instead of an inline banner.
function showAlert(message, type = 'error') {
  const variant = type === 'success' ? 'success' : 'error';
  modalText.textContent = message;
  modalIcon.className = `modal-icon ${variant}`;
  modalIcon.innerHTML = MODAL_ICONS[variant];
  modal.classList.remove('hidden');
  modalClose.focus();
}

function clearAlert() {
  modal.classList.add('hidden');
}

modalClose.addEventListener('click', clearAlert);
modal.addEventListener('click', (event) => {
  if (event.target === modal) clearAlert();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) clearAlert();
});

function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Add New Product';
  submitBtn.textContent = 'Add Product';
  cancelBtn.classList.add('hidden');
  imageHint.textContent = 'Required for new products. JPG, PNG, or WEBP — optimized automatically.';
  resetDropzone();
}

function startEdit(product) {
  idField.value = product.id;
  nameField.value = product.name;
  descriptionField.value = product.description;
  priceField.value = product.price;
  stockField.value = product.stock_quantity;
  burnTimeField.value = product.burn_time;
  imageField.value = '';
  imageHint.textContent = 'Leave empty to keep the current image.';
  formTitle.textContent = `Edit Product: ${product.name}`;
  submitBtn.textContent = 'Save Changes';
  cancelBtn.classList.remove('hidden');
  resetDropzone();
  scrollToEditSection();
}

// Scrolls so the top of the edit card (including its "Edit Product" heading)
// lands just below the sticky header, rather than hiding behind it.
function scrollToEditSection() {
  const card = form.closest('.admin-section-card') || form;
  const header = document.querySelector('.site-header');
  const headerOffset = header ? header.getBoundingClientRect().height : 0;
  const top = card.getBoundingClientRect().top + window.scrollY - headerOffset - 16;
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
}

// --- Drag & drop image uploader -------------------------------------------

let previewUrl = null;

function showImageError(message) {
  imageError.textContent = message;
  imageError.classList.remove('hidden');
  dropzone.classList.add('error');
}

function clearImageError() {
  imageError.textContent = '';
  imageError.classList.add('hidden');
  dropzone.classList.remove('error');
}

function renderPreview(file) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  dropzonePreviewImg.src = previewUrl;
  dropzoneFilename.textContent = file.name;
  dropzonePrompt.classList.add('hidden');
  dropzonePreview.classList.remove('hidden');
}

// Resets the uploader UI back to its empty prompt state. Assumes the file
// input itself has already been cleared (e.g. by form.reset()).
function resetDropzone() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  dropzonePreviewImg.src = '';
  dropzoneFilename.textContent = '';
  dropzonePreview.classList.add('hidden');
  dropzonePrompt.classList.remove('hidden');
  clearImageError();
}

// Validates a file, mirrors it onto the hidden <input> (so the existing
// FormData submission picks it up under the `image` key multer expects),
// and renders the preview.
function processFile(file, { assignToInput = false } = {}) {
  if (!file) return;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    imageField.value = '';
    resetDropzone();
    showImageError('Unsupported file type. Please use a JPG, PNG, or WEBP image.');
    return;
  }

  if (assignToInput) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    imageField.files = transfer.files;
  }

  clearImageError();
  renderPreview(file);
}

// Clicking anywhere in the zone opens the native file picker. Ignore clicks
// originating from the hidden input (it re-fires via .click()) and the
// Remove button so we don't reopen the dialog.
dropzone.addEventListener('click', (event) => {
  if (event.target === imageField || event.target.closest('#dropzone-remove')) return;
  imageField.click();
});

dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    imageField.click();
  }
});

imageField.addEventListener('change', () => {
  processFile(imageField.files[0]);
});

['dragenter', 'dragover'].forEach((type) => {
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'dragend'].forEach((type) => {
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'dragleave' && dropzone.contains(event.relatedTarget)) return;
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();
  dropzone.classList.remove('dragover');

  const file = event.dataTransfer?.files?.[0];
  processFile(file, { assignToInput: true });
});

dropzoneRemove.addEventListener('click', (event) => {
  event.stopPropagation();
  imageField.value = '';
  resetDropzone();
});

function renderProducts(products) {
  if (products.length === 0) {
    productsTableBody.innerHTML = '<tr><td colspan="6" class="admin-empty">No products yet.</td></tr>';
    return;
  }

  productsTableBody.innerHTML = products.map((product) => `
    <tr>
      <td><img class="admin-thumb" src="${escapeHtml(product.image_url)}" alt="" /></td>
      <td>${escapeHtml(product.name)}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.stock_quantity <= 5
        ? `<span class="badge badge-warning">${product.stock_quantity}</span>`
        : product.stock_quantity}</td>
      <td>${escapeHtml(product.burn_time)}</td>
      <td>
        <div class="admin-row-actions">
          <button class="btn btn-outline btn-sm" data-action="edit" data-id="${product.id}">Edit</button>
          <button class="btn btn-destructive btn-sm" data-action="delete" data-id="${product.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderOrders(orders) {
  if (orders.length === 0) {
    ordersTableBody.innerHTML = '<tr><td colspan="6" class="admin-empty">No orders yet.</td></tr>';
    return;
  }

  ordersTableBody.innerHTML = orders.map((order) => {
    const items = order.items.map((item) => `${item.quantity} × ${escapeHtml(item.productName)}`).join('<br />');
    return `
      <tr>
        <td>#${order.id}</td>
        <td>${escapeHtml(order.customerName)}<br /><span class="admin-muted">${escapeHtml(order.customerEmail)}</span></td>
        <td>${items}</td>
        <td>${formatCurrency(order.totalAmount)}</td>
        <td><span class="badge badge-outline">${escapeHtml(order.status)}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      </tr>
    `;
  }).join('');
}

function renderStats(stats) {
  statRevenue.textContent = formatCurrency(stats.totalRevenue);
  statOrders.textContent = stats.totalOrders;
  statLowStock.textContent = stats.lowStock.length;

  lowStockList.innerHTML = stats.lowStock.length === 0
    ? '<li class="admin-empty">All products are well stocked.</li>'
    : stats.lowStock.map((item) => `
        <li>
          <span>${escapeHtml(item.name)}</span>
          <span class="badge badge-warning">${item.stock_quantity} left</span>
        </li>
      `).join('');

  topSellingList.innerHTML = stats.topSelling.length === 0
    ? '<li class="admin-empty">No sales yet.</li>'
    : stats.topSelling.map((item) => `
        <li>
          <span>${escapeHtml(item.name)}</span>
          <span class="badge badge-success">${item.unitsSold} sold</span>
        </li>
      `).join('');
}

async function loadProducts() {
  const data = await api.get('/products');
  renderProducts(data.products);
  return data.products;
}

async function loadOrders() {
  const data = await api.get('/admin/orders');
  renderOrders(data.orders);
}

async function loadStats() {
  const data = await api.get('/admin/stats');
  renderStats(data);
}

async function refreshAll() {
  await Promise.all([loadProducts(), loadOrders(), loadStats()]);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert();

  const id = idField.value;

  // A new product must have an image; on edit it's optional (keeps existing).
  if (!id && !imageField.files.length) {
    showImageError('Please add a product image.');
    return;
  }

  const formData = new FormData(form);

  if (!imageField.files.length) {
    formData.delete('image');
  }

  submitBtn.disabled = true;

  try {
    if (id) {
      await api.uploadPut(`/admin/products/${id}`, formData);
      showAlert('Product updated successfully.', 'success');
    } else {
      await api.upload('/admin/products', formData);
      showAlert('Product added successfully.', 'success');
    }

    resetForm();
    await Promise.all([loadProducts(), loadStats()]);
  } catch (err) {
    showAlert(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  clearAlert();
});

productsTableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === 'edit') {
    const products = await loadProducts();
    const product = products.find((p) => String(p.id) === id);
    if (product) startEdit(product);
    return;
  }

  if (action === 'delete') {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;

    clearAlert();
    try {
      await api.delete(`/admin/products/${id}`);
      showAlert('Product deleted successfully.', 'success');
      await Promise.all([loadProducts(), loadStats()]);
    } catch (err) {
      showAlert(err instanceof ApiError ? err.message : 'Unable to delete this product.');
    }
  }
});

async function init() {
  const user = await guardAdminPage();
  if (!user) return;

  try {
    await refreshAll();
  } catch (err) {
    showAlert(err instanceof ApiError ? err.message : 'Unable to load dashboard data.');
  }
}

init();
