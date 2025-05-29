import { getDirectoryFromIdb } from "./IndexDb"
import { decryptWithAesKey } from "./passwordEncrypt"
export const privateKeyFileName = "rsaPrivateEncryptedKey.json"
export const passwordFileName   = "aesPassword.key"
export const getUserPrivateKey = async ()=>{
    // Get from file directory both password and privateKey 
    // Then decrypt the private key using password 
    const directory = await getDirectoryFromIdb(); // error1 ke directory nai malti.
    if (!directory) {
      console.log('Please select a directory first');
      return;
    }
    console.log(`directory: ${directory}`);
    const encryptedPrivateKey = await getContentFromFile(directory,privateKeyFileName)
    console.log(`encryptedPrivateKey: ${encryptedPrivateKey}`);
    
    const password            = await getContentFromFile(directory,passwordFileName)
    
    const decryptedPrivateKey =  await decryptWithAesKey(encryptedPrivateKey.cipherText,encryptedPrivateKey.iv,password)

    console.log(`decryptedPrivateKey: ${decryptedPrivateKey}`);
    return decryptedPrivateKey;
}

const getContentFromFile = async(baseHandle,fileName)=>{
    try {
      const dataDir = await baseHandle.getDirectoryHandle('data.codeamigoes');
      const privDir = await dataDir.getDirectoryHandle('privateData');
      const fileHandle = await privDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      // Decode to string for display; adjust as needed for binary
      const decoder = new TextDecoder();
      const text = decoder.decode(arrayBuffer);
      console.log(`Extracted text from  ${fileName} : ${text}`);
      return text;
    } catch (err) {
      console.error('Loading wrapped key failed', err);
      setMessage('Failed to load wrapped key');
    }
}