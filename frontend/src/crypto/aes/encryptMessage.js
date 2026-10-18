export const encryptMessage = async (plaintext, messageKey) => {

    const encoded = new TextEncoder().encode(plaintext);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv
        },
        messageKey,
        encoded
    )

    return {ciphertext,iv}; // ciphertext is an ArrayBuffer
};
