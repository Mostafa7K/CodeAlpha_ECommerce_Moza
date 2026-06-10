// Client-side shopping cart, persisted to localStorage.
// The cart is a simple array of { id, name, price, image_url, quantity, stock_quantity }.

const CART_STORAGE_KEY = 'moza_cart';

const subscribers = new Set();

function readCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read cart from storage:', err);
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  notifySubscribers(cart);
}

function notifySubscribers(cart) {
  subscribers.forEach((callback) => callback(cart));
}

// Subscribe to cart changes. Returns an unsubscribe function.
export function onCartChange(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function getCart() {
  return readCart();
}

export function addToCart(product, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === product.id);

  const maxQuantity = product.stock_quantity ?? Infinity;

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, maxQuantity);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      quantity: Math.min(quantity, maxQuantity)
    });
  }

  writeCart(cart);
  return cart;
}

export function updateQuantity(productId, quantity) {
  let cart = readCart();

  if (quantity <= 0) {
    cart = cart.filter((item) => item.id !== productId);
  } else {
    const item = cart.find((item) => item.id === productId);
    if (item) {
      const maxQuantity = item.stock_quantity ?? Infinity;
      item.quantity = Math.min(quantity, maxQuantity);
    }
  }

  writeCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = readCart().filter((item) => item.id !== productId);
  writeCart(cart);
  return cart;
}

export function clearCart() {
  writeCart([]);
}

export function getCartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal() {
  return readCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
