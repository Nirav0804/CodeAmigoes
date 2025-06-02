export function stringToArrayBuffer(str) {
    // Assuming str is a hex-encoded string (64 characters for 32 bytes)
    
    const bytes = new Uint8Array(str.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    // console.log(bytes);
    // console.log(bytes.length);
    if (bytes.length !== 32) {
        throw new Error('Key must decode to exactly 32 bytes for 256-bit AES');
    }
    return bytes.buffer;
}

export function arrayBufferToString(buffer) {
    return new TextDecoder().decode(buffer);
}

export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
export async function encrypt(data, secretKey) {
    try {
        // console.log("Data", data);
        // console.log("Key", secretKey);

        const keyMaterial = stringToArrayBuffer(secretKey); // Now decodes hex to 32 bytes
        // console.log("Key Material : ",keyMaterial);
        
        const key = await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            { name: 'AES-CBC' },
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encodedData = new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            key,
            encodedData
        );

        const combined = new Uint8Array(16 + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), 16);
        return arrayBufferToBase64(combined.buffer);
    } catch (error) {
        throw new Error('Encryption failed: ' + error.message);
    }
}

export async function decrypt(encryptedData, secretKey) {
    try {
        const keyMaterial = stringToArrayBuffer(secretKey); // Now decodes hex to 32 bytes
        const key = await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        const combined = base64ToArrayBuffer(encryptedData);
        const iv = combined.slice(0, 16);
        const encrypted = combined.slice(16);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        throw new Error('Decryption failed: ' + error.message);
    }
}