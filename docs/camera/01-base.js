"use strict";
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } } };
const getCookie = (k) => (document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)")) || [])[1] || null;
const setCookie = (k, v) => { try { document.cookie = `${k}=${v}; max-age=31536000; path=/; SameSite=Lax`; } catch { /* cookie bloccati */ } };
