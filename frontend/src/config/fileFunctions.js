import { getDirectoryFromIdb } from "./IndexDb";
import { decryptWithAesKey, importKeyFromBase64 } from "./passwordEncrypt";

export const privateKeyFileName = "rsaPrivateEncryptedKey.json";
export const passwordFileName = "aesPassword.key";

export const getUserPrivateKey = async (username) => {
  const directory = await getDirectoryFromIdb(username);
  if (!directory) {
    // console.log('Please select a directory first');
    return;
  }
  // console.log(`directory: ${directory}`);
  const encryptedPrivateKey1 = await getContentFromFile(username,directory, privateKeyFileName);
  // console.log(`encryptedPrivateKey: ${encryptedPrivateKey1}`);
  const encryptedPrivateKey = JSON.parse(encryptedPrivateKey1);
  const passwordBase64 = await getContentFromFile(username,directory, passwordFileName);
  
  // Import the Base64-encoded AES key as a CryptoKey
  const aesKey = await importKeyFromBase64(passwordBase64);

  const decryptedPrivateKey = await decryptWithAesKey(
    encryptedPrivateKey.cipherText,
    encryptedPrivateKey.iv,
    aesKey
  );

  // console.log(`decryptedPrivateKey: ${decryptedPrivateKey}`);
  return decryptedPrivateKey;
};

const getContentFromFile = async (username,baseHandle, fileName) => {
  try {
    const dataDir = await baseHandle.getDirectoryHandle(`${username}.data.codeamigoes`);
    const privDir = await dataDir.getDirectoryHandle('privateData');
    const fileHandle = await privDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder();
    const text = decoder.decode(arrayBuffer);
    // console.log(`Extracted text from ${fileName}: ${text}`);
    return text;
  } catch (err) {
    console.error('Loading wrapped key failed', err);
  }
};

export const isMobileDevice = () => {
    const ua = navigator.userAgent || "";
    console.log(ua);
    const isAndroidPhone = /Android/i.test(ua) && /Mobile/i.test(ua);
    const isIPhoneOrIPod = /iPhone|iPod/i.test(ua);
    return isAndroidPhone || isIPhoneOrIPod;
};

export const isFileSystemSupported = ()=> ("showDirectoryPicker" in window) 