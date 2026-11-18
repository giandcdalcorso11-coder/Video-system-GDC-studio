/* Chiave della regia: solo chi ha la chiave privata può comandare le camere.
   - La regia ha una coppia di chiavi (ECDSA P-256). La parte pubblica (p) sta nei link delle camere (QR), la privata (d) solo nel link della dashboard.
   - Ogni comando della regia è firmato; la camera controlla la firma, che il messaggio non sia già stato ricevuto e che non sia troppo vecchio.
   - Un link di camera senza p (link vecchi) lavora senza controllo, come prima. */
(function () {
  "use strict";
  const b64u = {
    enc: (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    dec: (s) => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
  };
  const subtle = (window.crypto && crypto.subtle) || null, ALG = { name: "ECDSA", namedCurve: "P-256" }, SIG = { name: "ECDSA", hash: "SHA-256" };
  const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.keys(v).sort().reduce((o, k) => ((o[k] = sortKeys(v[k])), o), {}) : v);
  // Si firma la versione ripulita del messaggio (la stessa che il ricevente vede dopo la pulizia di rt.js)
  const canon = (payload) => JSON.stringify(sortKeys(GDC_RT.clean(payload)));
  const txt = (s) => new TextEncoder().encode(s);
  const pubJwk = (p) => ({ kty: "EC", crv: "P-256", x: p.slice(0, 43), y: p.slice(43), ext: true });
  const okP = (p) => typeof p === "string" && /^[A-Za-z0-9_-]{86}$/.test(p), okD = (d) => typeof d === "string" && /^[A-Za-z0-9_-]{43}$/.test(d);
  const sid = b64u.enc(crypto.getRandomValues(new Uint8Array(9)));
  let n = 0, warned = false;

  async function gen() {
    const kp = await subtle.generateKey(ALG, true, ["sign", "verify"]), j = await subtle.exportKey("jwk", kp.privateKey);
    return { p: j.x + j.y, d: j.d };
  }
  /** la dashboard prepara le sue chiavi se il link non le conteneva */
  async function ensure(pairing) {
    if (!subtle || !pairing) return;
    if (okP(pairing.p) && okD(pairing.d)) return;
    if (okP(pairing.p) && !okD(pairing.d)) { if (!warned) { warned = true; console.warn("Questa regia ha solo la chiave pubblica: non può firmare i comandi. Usa il link della dashboard."); } return; }
    const k = await gen(); pairing.p = k.p; pairing.d = k.d; GDC_RT.Pair.save(pairing);
  }
  /** aggiunge numero, ora e firma a un comando (se la regia ha la chiave privata) */
  async function signCmd(pairing, payload) {
    if (!subtle || !pairing || !okP(pairing.p) || !okD(pairing.d)) return payload;
    // i campi della firma hanno nomi propri (as, an, at) per non scontrarsi con quelli dei comandi (es. sid = clip da trasferire)
    const body = { ...payload, as: sid, an: ++n, at: Date.now() };
    const key = await subtle.importKey("jwk", { ...pubJwk(pairing.p), d: pairing.d, key_ops: ["sign"] }, ALG, false, ["sign"]);
    return { ...body, sig: b64u.enc(new Uint8Array(await subtle.sign(SIG, key, txt(canon(body))))) };
  }
  /** la camera controlla la firma di un comando */
  async function verify(p, payload, sig) {
    try {
      if (!subtle || !okP(p) || typeof sig !== "string" || !/^[A-Za-z0-9_-]{80,100}$/.test(sig)) return false;
      const key = await subtle.importKey("jwk", { ...pubJwk(p), key_ops: ["verify"] }, ALG, false, ["verify"]);
      return await subtle.verify(SIG, key, b64u.dec(sig), txt(canon(payload)));
    } catch { return false; }
  }
  window.GDC_AUTH = { ensure, signCmd, verify, gen, okP, okD };
})();
