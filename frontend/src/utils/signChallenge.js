import { getIdentity } from "./indexedDB"

export const signChallenge = async(challenge) => {
    const {privateKey} = await getIdentity();

    const pKey = await crypto.subtle.importKey("pkcs8",privateKey,{name: "ECDSA",namedCurve: "P-256"},true,["sign"]);


    const encoder = new TextEncoder();

    const signature = await crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: "SHA-256"
        },
        pKey,
        encoder.encode(challenge)
    );


    return signature;
}