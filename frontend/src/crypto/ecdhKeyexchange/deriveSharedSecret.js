export const deriveSharedSecret = async (privateKey, peerPublicKey) => {
    const sharedSecret = await window.crypto.subtle.deriveBits(
        {
            name: "ECDH",
            public: peerPublicKey,
        },
        privateKey,
        256
    );

    return sharedSecret;
};

export const importPeerPublicKey = async (peerPublicKeyJwk) => {
    return await crypto.subtle.importKey(
        "jwk",
        peerPublicKeyJwk,
        {
            name: "ECDH",
            namedCurve: "P-256"
        },
        true,
        []
    );
}