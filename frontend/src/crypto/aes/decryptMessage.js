// throws if the auth tag does not verify (tampered or wrong key)
export const decryptMessage = async (ciphertext, messageKey, iv) => {

    const plaintext = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv
        },
        messageKey,
        ciphertext
    )

    return new TextDecoder().decode(plaintext);

}
