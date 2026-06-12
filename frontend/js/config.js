// Resolves the backend API base URL for the Moza storefront.
//
// This is a static (build-tool-free) site, so there is no bundler to inline
// process.env / import.meta.env values at build time. Instead:
//  - On localhost/127.0.0.1 the local Express backend is used.
//  - Everywhere else (e.g. the Vercel deployment) PRODUCTION_API_BASE_URL is
//    used. Update it to your deployed backend's URL (e.g. Render).
//  - Either value can be overridden at runtime by defining
//    `window.__MOZA_API_BASE_URL__` before this module loads.

const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const PRODUCTION_API_BASE_URL = 'https://api.moza-candles.com/api';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE_URL =
  window.__MOZA_API_BASE_URL__ || (isLocalHost ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL);
