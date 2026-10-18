import { deriveMessageKey } from "../crypto/ecdhKeyexchange/sessionKeys";
import { encryptMessage } from "../crypto/aes/encryptMessage";
import { decryptMessage } from "../crypto/aes/decryptMessage";

export const CHAT_TYPES = {

    CHAT_MESSAGE: "chat-message",

    CHAT_ACK: "chat-ack"

};

export const MAX_MESSAGE_LENGTH = 4000;

// worst case: 4000 chars JSON-escaped to 6 bytes each + GCM tag, base64 encoded (~32KB)
const MAX_CIPHERTEXT_LENGTH = 64 * 1024;



const arrayBufferToBase64 = (buffer) => {

    const bytes = new Uint8Array(buffer);

    let binary = "";

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
};


const base64ToArrayBuffer = (base64) => {

    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
};


// send only if channel is still open (used for acks, never throws)
const safeSend = (dataChannel, obj) => {

    if (dataChannel?.readyState === "open") {
        dataChannel.send(JSON.stringify(obj));
    }

};



// only messageId, iv and ciphertext travel in the clear; text and timestamp are encrypted
export const sendChatMessage = async (text, sessionKeyMaterial, dataChannel) => {

    if (typeof text !== "string" || !text.trim()) throw new Error("Message is empty");

    if (text.length > MAX_MESSAGE_LENGTH) throw new Error("Message is too long");

    if (!sessionKeyMaterial) throw new Error("Secure session not ready");

    if (dataChannel?.readyState !== "open") throw new Error("Connection closed");


    const messageId = crypto.randomUUID();

    const sentAt = Date.now();

    const messageKey = await deriveMessageKey(sessionKeyMaterial, messageId);

    const { ciphertext, iv } = await encryptMessage(
        JSON.stringify({ text, sentAt }),
        messageKey
    );

    // channel may have closed while we were encrypting
    if (dataChannel.readyState !== "open") throw new Error("Connection closed");

    dataChannel.send(
        JSON.stringify({
            type: CHAT_TYPES.CHAT_MESSAGE,
            messageId,
            iv: Array.from(iv),
            ciphertext: arrayBufferToBase64(ciphertext)
        })
    );

    return { messageId, text, sentAt };
};



// returns { messageId, text, sentAt } or null if the message could not be verified/decrypted
export const receiveChatMessage = async (payload, sessionKeyMaterial, dataChannel) => {

    const { messageId, iv, ciphertext } = payload ?? {};

    const hasUsableId = typeof messageId === "string" && messageId.length > 0 && messageId.length <= 64;

    try {

        if (!hasUsableId) throw new Error("Invalid messageId");

        if (!Array.isArray(iv) || iv.length !== 12 || !iv.every(b => Number.isInteger(b) && b >= 0 && b <= 255)) {
            throw new Error("Invalid iv");
        }

        if (typeof ciphertext !== "string" || ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
            throw new Error("Invalid ciphertext");
        }

        if (!sessionKeyMaterial) throw new Error("Secure session not ready");


        const messageKey = await deriveMessageKey(sessionKeyMaterial, messageId);

        const plaintext = await decryptMessage(
            base64ToArrayBuffer(ciphertext),
            messageKey,
            new Uint8Array(iv)
        );

        const { text, sentAt } = JSON.parse(plaintext);

        if (typeof text !== "string" || text.length > MAX_MESSAGE_LENGTH) throw new Error("Invalid text");

        if (typeof sentAt !== "number" || !Number.isFinite(sentAt)) throw new Error("Invalid sentAt");


        safeSend(dataChannel, {
            type: CHAT_TYPES.CHAT_ACK,
            messageId,
            status: "delivered"
        });

        return { messageId, text, sentAt };

    } catch (error) {

        console.error("Chat message rejected:", error);

        if (hasUsableId) {
            safeSend(dataChannel, {
                type: CHAT_TYPES.CHAT_ACK,
                messageId,
                status: "failed"
            });
        }

        return null;
    }

};
