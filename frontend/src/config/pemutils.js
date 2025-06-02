// src/config/pemUtils.js

export function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function formatAsPem(str, type) {
  let header, footer;
  if (type === "PUBLIC") {
    header = "-----BEGIN PUBLIC KEY-----";
    footer = "-----END PUBLIC KEY-----";
  } else {
    header = "-----BEGIN RSA PRIVATE KEY-----";
    footer = "-----END RSA PRIVATE KEY-----";
  }
  const lines = str.match(/.{1,64}/g).join('\n');
  return `${header}\n${lines}\n${footer}`;
}

export async function exportKeyAsPem(key, type) {
  const exportType = type === "PUBLIC" ? "spki" : "pkcs8";
  const exported = await window.crypto.subtle.exportKey(exportType, key);
  const base64 = arrayBufferToBase64(exported);
  return formatAsPem(base64, type);
}


