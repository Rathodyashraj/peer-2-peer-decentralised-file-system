export const generateECDHKeyPair = async() => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
    
    const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    
    return {publicKey, privateKey: keyPair.privateKey};
}