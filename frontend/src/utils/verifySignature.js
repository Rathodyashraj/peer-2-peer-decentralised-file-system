const base64ToArrayBuffer = (base64) => {

    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;

};

export const verifySignature = async (challenge,signature,publicKeyBase64) => {

    const publicKey = await crypto.subtle.importKey(
        "spki",
        base64ToArrayBuffer(publicKeyBase64),
        {
            name: "ECDSA",
            namedCurve: "P-256"
        },
        true,
        ["verify"]
    );

    const encoder = new TextEncoder();

    return await crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: "SHA-256"
        },
        publicKey,
        signature,
        encoder.encode(challenge)
    );

};