import { set as idbSet, get as idbGet } from 'idb-keyval';
import { decryptMessage, encryptMessage } from './rasCrypto';
import { chatSecretKeyStore, publicKeyStore } from '../components/Chat/ChatDropDown';
import { createStore } from 'idb-keyval';
import { getUserPrivateKey } from './fileFunctions';
// Create directory handler store globally
export const directoryHandlerStore = createStore('directory-handler-store', 'directory-handler');

export const storeSecretChatKeyInIdb = async(partnerName,secretKey,storeName)=>{
     
    const encryptedSecretKey = await encryptMessage(secretKey,localStorage.getItem("rsaPublicKey"));
    console.log("Storing in indexDb",partnerName,secretKey);
    
    await idbSet(partnerName,encryptedSecretKey,storeName); // secretKey - > encryptedSecretKey
}

export const getPublicKeyFromIdb = async(key)=>{
    await idbGet( key , publicKeyStore )
}

export const getChatKeyFromIdb = async(key)=>{
    const encryptedChatKey = await idbGet(key, chatSecretKeyStore);
    if(!encryptedChatKey){
        return null;
    }
    console.log("Hello:"+encryptedChatKey);
    
    const privateKey = localStorage.getItem("rsaPrivateKey");
    // const privateKey = await getUserPrivateKey();
    console.log("PrivateKey Encrypted"+privateKey);

    const decryptedSecretKey = await decryptMessage(encryptedChatKey,privateKey);
    console.log(`Retrieved key for ${key}: ${encryptedChatKey}`);
    return decryptedSecretKey;
}

export const setDirectoryInIdb = async(directory)=>{
    try{
        await idbSet('directory-path',directory,directoryHandlerStore);
        console.log(`Directory ${directory} stored and saved`);
    } catch (error) {
        console.log("Error picking directory");
    }
}

export const getDirectoryFromIdb = async()=>{
    if ('showDirectoryPicker' in window) { //  feature to check browser supports files system api. 
        try {
          const saved = await idbGet('directory-path',directoryHandlerStore);
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
}
