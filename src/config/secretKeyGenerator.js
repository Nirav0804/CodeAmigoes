async function generateBase64AesKey() {
  // 1. Generate an extractable AES-GCM key
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,                     // mark extractable so we can export it
    ['encrypt', 'decrypt']
  );

  // 2. Export the raw key bytes
  const raw = await window.crypto.subtle.exportKey('raw', key); // ArrayBuffer

  // 3. Convert to Base64
  const bytes = new Uint8Array(raw);
  let binary = '';
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);      // Base64-encoded key
}
export {generateBase64AesKey}