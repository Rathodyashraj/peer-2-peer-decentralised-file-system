//convert sharedsecret to hkdfKey material
export const importSessionKeyMaterial = async (sharedSecret) => {
    const sessionKeyMaterial = await window.crypto.subtle.importKey(
        "raw",
        sharedSecret,
        { name: "HKDF" },
        false,
        ["deriveKey"]
    );

    return sessionKeyMaterial;
}

const HKDF_SALT = new Uint8Array(16);

// generate AESfilekey from hkdfKey material
export const deriveFileKey = async (sessionKeyMaterial, fileId) => {
    const fileKey = await window.crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: HKDF_SALT,
            info: new TextEncoder().encode(`Peershare File Key: ${fileId}`),
        },
        sessionKeyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"] 
    )
    
    return fileKey;

}

// generate AES message key from hkdfKey material
// separate info label keeps message keys domain-separated from file keys
export const deriveMessageKey = async (sessionKeyMaterial, messageId) => {
    const messageKey = await window.crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: HKDF_SALT,
            info: new TextEncoder().encode(`PeerShare Message Key: ${messageId}`),
        },
        sessionKeyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    )

    return messageKey;

}