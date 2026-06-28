import { getIdentity } from "./indexedDB"

export const signChallenge = async(challenge) => {
    const {pKey} = await getIdentity();
    
    const privateKey = await crypto.subtle.importKey("pkcs8",pKey,{name: "ECDSA",namedCurve: "P-256"},true,["sign"]);

    const encoder = new TextEncoder();

    const signature = await crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: "SHA-256"
        },
        privateKey,
        encoder.encode(challenge)
    );


    return signature;
}