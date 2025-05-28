import { set as idbSet, get as idbGet } from 'idb-keyval';
import { chatSecretKeyStore, publicKeyStore } from '../components/Chat/ChatDropDown';
import { encryptAES } from '../components/PersonalChat/PersonalChatChat';
export const storeSecretChatKeyInIdb = async(partnerName,secretKey,publicKey,storeName)=>{
    // const encryptedSecretKey = await encryptAES(secretKey,publicKey);
    await idbSet(partnerName,secretKey,storeName); // secretKey - > encryptedSecretKey
}

export const getPublicKeyFromIdb = async(key)=>{
    await idbGet(key,publicKeyStore)
}

export const getChatKeyFromIdb = async(key)=>{
    const chatKey = await idbGet(key, chatSecretKeyStore);
    
    console.log(`Retrieved key for ${key}: ${chatKey}`);
    return chatKey;
}