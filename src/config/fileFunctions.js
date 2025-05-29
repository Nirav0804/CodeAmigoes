import { getDirectoryFromIdb } from "./IndexDb";
import { decryptWithAesKey, importKeyFromBase64 } from "./passwordEncrypt";

export const privateKeyFileName = "rsaPrivateEncryptedKey.json";
export const passwordFileName = "aesPassword.key";

export const getUserPrivateKey = async () => {
  const directory = await getDirectoryFromIdb();
  if (!directory) {
    console.log('Please select a directory first');
    return;
  }
  console.log(`directory: ${directory}`);
  const encryptedPrivateKey1 = await getContentFromFile(directory, privateKeyFileName);
  console.log(`encryptedPrivateKey: ${encryptedPrivateKey1}`);
  const encryptedPrivateKey = JSON.parse(encryptedPrivateKey1);
  const passwordBase64 = await getContentFromFile(directory, passwordFileName);
  
  // Import the Base64-encoded AES key as a CryptoKey
  const aesKey = await importKeyFromBase64(passwordBase64);

  const decryptedPrivateKey = await decryptWithAesKey(
    encryptedPrivateKey.cipherText,
    encryptedPrivateKey.iv,
    aesKey
  );

  console.log(`decryptedPrivateKey: ${decryptedPrivateKey}`);
  return decryptedPrivateKey;
};

const getContentFromFile = async (baseHandle, fileName) => {
  try {
    const dataDir = await baseHandle.getDirectoryHandle('data.codeamigoes');
    const privDir = await dataDir.getDirectoryHandle('privateData');
    const fileHandle = await privDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder();
    const text = decoder.decode(arrayBuffer);
    console.log(`Extracted text from ${fileName}: ${text}`);
    return text;
  } catch (err) {
    console.error('Loading wrapped key failed', err);
    setMessage('Failed to load wrapped key');
  }
};