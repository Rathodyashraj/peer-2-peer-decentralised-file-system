export const decyrptFile = async(ciphertext,fileKey,iv) => {

    const plaintext = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv
        },
        fileKey,
        ciphertext
    )


    return plaintext; // array buffer

}