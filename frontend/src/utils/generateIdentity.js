const arrayBufferToBase64 = (buffer) => {

    return btoa(
        String.fromCharCode(
            ...new Uint8Array(buffer)
        )
    );

};

export const generateIdentity = async () => {
    const deviceId = crypto.randomUUID();
    
    //generate keypairs
    const keyPair = await crypto.subtle.generateKey(
        {
        name: "ECDSA",
        namedCurve: "P-256"
        },
        true,
        ["sign","verify"]
    )

    const publicKey = await crypto.subtle.exportKey("spki",keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey("pkcs8",keyPair.privateKey); // can remove aftwerwards

    return {
        deviceId,
        publicKey: arrayBufferToBase64(publicKey),
        privateKey
    }

}