export const deriveRootKey = async(sharedSecret) => {
    
    //first import shared secret into a CryptoKey object
    const sharedSecretKey = await crypto.subtle.importKey(
        "raw",
        sharedSecret,
        { name: "HKDF" },
        false,
        ["deriveKey"]
    );


    //derive root session key from shared secret using HKDF
    const rootSessionKey = await crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array(16), 
            info: new TextEncoder().encode("root session key"),
        },
        sharedSecretKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    return rootSessionKey;


}