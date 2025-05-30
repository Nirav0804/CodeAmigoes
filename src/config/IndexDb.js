import { set as idbSet, get as idbGet } from 'idb-keyval';
import { decryptMessage, encryptMessage } from './rasCrypto';
import { chatSecretKeyStore, publicKeyStore } from '../components/Chat/ChatDropDown';
import { createStore } from 'idb-keyval';
import { getUserPrivateKey } from './fileFunctions';
const API_BASE = import.meta.env.VITE_API_BASE_URL;
// Create directory handler store globally
export const directoryHandlerStore = createStore('directory-handler-store', 'directory-handler');

export const storeSecretChatKeyInIdb = async (partnerName, secretKey, storeName,username) => {
  console.log("username"+username);
       const getPublicKey = async (username, API_BASE) => {
                    console.log("inside getpublic key")
                    let publicKey = localStorage.getItem('rsaPublicKey');
                    if (!publicKey) {
                        try {
                        const response = await fetch(`${API_BASE}/api/users/public_key/${username}`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        if (response.ok) {
                            publicKey = await response.text();
                            localStorage.setItem('rsaPublicKey', publicKey);
                        } else {
                            console.error('Public key not found in backend');
                            return null;
                        }
                        } catch (error) {
                        console.error('Error fetching public key:', error);
                        return null;
                        }
                    }
                return publicKey;
                };

// Usage:
const publicKey = await getPublicKey(username, API_BASE);
  const encryptedSecretKey = await encryptMessage(secretKey,publicKey);
  console.log("Storing in indexDb", partnerName, secretKey);
  await idbSet(partnerName, encryptedSecretKey, storeName);
};

export const getPublicKeyFromIdb = async (key) => {
  return await idbGet(key, publicKeyStore);
};

export const getChatKeyFromIdb = async (key) => {
  const encryptedChatKey = await idbGet(key, chatSecretKeyStore);
  if (!encryptedChatKey) {
    return null;
  }
  console.log("Hello: " + encryptedChatKey);
  
  const privateKey = await getUserPrivateKey();
  console.log("PrivateKey Encrypted: " + privateKey);
  
  const decryptedSecretKey = await decryptMessage(encryptedChatKey, privateKey);
  console.log(`Retrieved key for ${key}: ${encryptedChatKey}`);
  return decryptedSecretKey;
};

export const setDirectoryInIdb = async (directory) => {
  try {
    await idbSet('directory-path', directory, directoryHandlerStore);
    console.log(`Directory ${directory} stored and saved`);
  } catch (error) {
    console.log("Error picking directory");
  }
};

export const getDirectoryFromIdb = async () => {
  if ('showDirectoryPicker' in window) {
    try {
      const saved = await idbGet('directory-path', directoryHandlerStore);
      if (saved) {
        const permission = await saved.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted' ||
            (permission === 'prompt' && (await saved.requestPermission({ mode: 'readwrite' })) === 'granted')) {
          return saved;
        }
      }
    } catch (err) {
      console.warn('Error restoring directory handle', err);
    }
  }
  return null;
};