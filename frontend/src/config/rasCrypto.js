// rsaCrypto.js
// Encrypt/decrypt using RSA-OAEP with PEM keys (already converted)

// Convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [\w\s]+-----/, '')
    .replace(/-----END [\w\s]+-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Import PEM public key to CryptoKey
export async function importPublicKey(pem) {
  const binaryDer = pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

// Import PEM private key to CryptoKey
export async function importPrivateKey(pem) {
  const binaryDer = pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

// Encrypt plaintext string with PEM public key
export async function encryptMessage(plaintext, publicKeyPem) {
  const publicKey = await importPublicKey(publicKeyPem);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plaintext);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    encoded
  );
  return arrayBufferToBase64(encrypted);
}

// Decrypt base64 ciphertext with PEM private key
export async function decryptMessage(ciphertextBase64, privateKeyPem) {
  // console.log("decrypt function called");
  // console.log(ciphertextBase64);
  // console.log(privateKeyPem);
  const privateKey = await importPrivateKey(privateKeyPem);
  // console.log(`ImportedPrivateKey: ${privateKey} `);
  
  const encryptedBuffer = base64ToArrayBuffer(ciphertextBase64);
  // console.log(`EncryptedBuffer ${encryptedBuffer} `);
  
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedBuffer
  );
  
  // console.log(`Decrypted: ${decrypted}`);

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
