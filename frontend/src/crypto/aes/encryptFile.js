export const encryptFile = async (file, fileKey) => {

    const plaintext = await file.arrayBuffer(); // convert file to array buffer

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv
        },
        fileKey,
        plaintext
    )

    return {ciphertext,iv};
};