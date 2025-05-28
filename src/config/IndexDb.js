import { set as idbSet, get as idbGet } from 'idb-keyval';
import { decryptMessage, encryptMessage } from './rasCrypto';
import { chatSecretKeyStore, publicKeyStore } from '../components/Chat/ChatDropDown';


export const storeSecretChatKeyInIdb = async(partnerName,secretKey,storeName)=>{
     
    const encryptedSecretKey = await encryptMessage(secretKey,localStorage.getItem("rsaPublicKey"));
    console.log("Storing in indexDb",partnerName,secretKey);
    
    await idbSet(partnerName,encryptedSecretKey,storeName); // secretKey - > encryptedSecretKey
}

export const getPublicKeyFromIdb = async(key)=>{
    await idbGet(key,publicKeyStore)
}

export const getChatKeyFromIdb = async(key)=>{
    const encryptedChatKey = await idbGet(key, chatSecretKeyStore);
    if(!encryptedChatKey){
        return null;
    }
    const privateKey = localStorage.getItem("rsaPrivateKey");
    const decryptedSecretKey = await decryptMessage(encryptedChatKey,privateKey);
    console.log(`Retrieved key for ${key}: ${encryptedChatKey}`);
    return decryptedSecretKey;
}