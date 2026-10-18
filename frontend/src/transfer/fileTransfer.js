import { deriveFileKey } from "../crypto/ecdhKeyexchange/sessionKeys";
import { encryptFile } from "../crypto/aes/encryptFile";

export const MESSAGE_TYPES = {

    FILE_METADATA: "file-metadata",

    FILE_CHUNK: "file-chunk",

    FILE_COMPLETE: "file-complete",

    TRANSFER_CANCEL: "transfer-cancel",

    TRANSFER_ERROR: "transfer-error",

    // receiver -> sender acknowledgements
    FILE_PROGRESS: "file-progress",

    FILE_RECEIVED: "file-received"

};

const CHUNK_SIZE = 64 * 1024;

const HIGH_BUFFER_LIMIT = 1024*1024;

const LOW_BUFFER_LIMIT = 256*1024;



const assertOpen = (dataChannel) => {

    if (dataChannel?.readyState !== "open") {
        throw new Error("Connection closed");
    }

};


// send only if channel is still open (used for acks, never throws)
const safeSend = (dataChannel, obj) => {

    if (dataChannel?.readyState === "open") {
        dataChannel.send(JSON.stringify(obj));
    }

};


// backpressure(app side buffering)
// rejects if the channel closes while waiting, so the sender never hangs
const waitForBufferDrain = async(dataChannel) => {

    assertOpen(dataChannel);

    if (dataChannel.bufferedAmount < HIGH_BUFFER_LIMIT) {
        return;
    }

    return new Promise((resolve, reject) => {

        dataChannel.bufferedAmountLowThreshold =
            LOW_BUFFER_LIMIT;

        const cleanup = () => {

            dataChannel.removeEventListener(
                "bufferedamountlow",
                handleBufferLow
            );

            dataChannel.removeEventListener(
                "close",
                handleClose
            );

        };

        const handleBufferLow = () => {
            cleanup();
            resolve();
        };

        const handleClose = () => {
            cleanup();
            reject(new Error("Connection closed"));
        };

        dataChannel.addEventListener(
            "bufferedamountlow",
            handleBufferLow
        );

        dataChannel.addEventListener(
            "close",
            handleClose
        );

    });

};



const chunkCiphertext = (cipherText) => {

    const chunks = [];

    let index = 0;

    for(let offset = 0; offset < cipherText.byteLength; offset += CHUNK_SIZE){

        const data = cipherText.slice(offset,offset + CHUNK_SIZE);

        chunks.push({
            index,
            data
        });

        index++;
    }

    return chunks;
};



// fileId -> { chunkCount, onProgress, resolve, reject }
// outgoing files waiting for the receiver to confirm decryption
const pendingOutgoing = new Map();


// onProgress(percent, stage) -> stage: "encrypting" | "sending" | "confirming" | "done"
// percent reflects chunks the receiver has confirmed, not chunks we pushed into the buffer
// resolves only after the receiver has reassembled and decrypted the file
export const sendFile = async (file,sessionKeyMaterial,dataChannel,onProgress) => {

    const fileId = crypto.randomUUID();

    onProgress?.(0, "encrypting");

    // Derive AES file key
    const fileKey = await deriveFileKey(sessionKeyMaterial,fileId);

    // Encrypt file and then make chunks
    const { ciphertext, iv } = await encryptFile(file,fileKey);

    const chunks = chunkCiphertext(ciphertext);


    const metadata = {
        type: MESSAGE_TYPES.FILE_METADATA,
        fileId,
        fileName: file.name,
        fileSize: file.size,
        encryptedSize: ciphertext.byteLength,
        mimeType: file.type,
        iv: Array.from(iv),
        chunkCount: chunks.length
    };


    // register before metadata goes out so no ack can arrive unmatched
    const confirmation = new Promise((resolve, reject) => {

        pendingOutgoing.set(fileId, {
            chunkCount: chunks.length,
            onProgress,
            resolve,
            reject
        });

    });

    // may reject while we are still sending; it is awaited below
    confirmation.catch(() => {});


    try {

        assertOpen(dataChannel);

        onProgress?.(0, "sending");

        dataChannel.send(
            JSON.stringify(metadata)
        );


        for (let i = 0; i < chunks.length; i++) {

            const chunk = chunks[i];

            await waitForBufferDrain(dataChannel);

            // receiver reported an error or connection was cleared
            if (!pendingOutgoing.has(fileId)) break;

            dataChannel.send(
                JSON.stringify({
                    type: MESSAGE_TYPES.FILE_CHUNK,
                    fileId,
                    chunkIndex: chunk.index
                })
            );

            dataChannel.send(chunk.data);

        }

        if (pendingOutgoing.has(fileId)) {

            dataChannel.send(
                JSON.stringify({
                    type: MESSAGE_TYPES.FILE_COMPLETE,
                    fileId
                })
            );

        }

        await confirmation;

    } catch (error) {

        pendingOutgoing.delete(fileId);

        throw error;

    }

};



// handles receiver -> sender acks for our outgoing files
// returns true if the message was consumed
export const handleFileAck = (data) => {

    const entry = pendingOutgoing.get(data?.fileId);

    if (!entry) return false;

    switch (data.type) {

        case MESSAGE_TYPES.FILE_PROGRESS: {

            const progress = entry.chunkCount
                ? Math.min(100, Math.floor((data.receivedChunks / entry.chunkCount) * 100))
                : 100;

            entry.onProgress?.(progress, progress >= 100 ? "confirming" : "sending");

            return true;
        }


        case MESSAGE_TYPES.FILE_RECEIVED: {

            pendingOutgoing.delete(data.fileId);

            entry.onProgress?.(100, "done");

            entry.resolve();

            return true;
        }


        case MESSAGE_TYPES.TRANSFER_ERROR: {

            pendingOutgoing.delete(data.fileId);

            entry.reject(new Error(data.reason || "Transfer failed"));

            return true;
        }


        default:
            return false;

    }

};



export const reassembleCiphertext = (chunks) => {

    // Calculate total ciphertext size
    const totalSize = chunks.reduce(
        (size, chunk) => size + chunk.byteLength,
        0
    );

    // Allocate final ciphertext buffer
    const ciphertext = new Uint8Array(totalSize);

    let offset = 0;

    // Copy every chunk into final buffer
    for (const chunk of chunks) {

        ciphertext.set(
            new Uint8Array(chunk),
            offset
        );

        offset += chunk.byteLength;
    }

    // Return complete ciphertext as ArrayBuffer
    return ciphertext.buffer;
};





const incomingTransfers = new Map();

let pendingChunk = null;


export const clearFileTransfer = () => {

    // unblock any sender still waiting for confirmation
    for (const entry of pendingOutgoing.values()) {
        entry.reject(new Error("Connection closed"));
    }

    pendingOutgoing.clear();
    incomingTransfers.clear();
    pendingChunk = null;
}


// handlers:
//   onProgress(metadata, percent)
//   onTransferComplete(transfer)  -> must throw if decryption fails
//   onTransferFailed(metadata, reason)
export const receiveFile = async (message,dataChannel,{ onProgress, onTransferComplete, onTransferFailed } = {}) => {

    // Binary chunk
    if (message instanceof ArrayBuffer) {

        if (!pendingChunk) return;

        const {fileId,chunkIndex} = pendingChunk;

        pendingChunk = null;

        const transfer = incomingTransfers.get(fileId);

        if (!transfer) return;

        if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= transfer.chunks.length) return;

        if (!transfer.chunks[chunkIndex]) transfer.receivedCount++;

        transfer.chunks[chunkIndex] = message;


        const progress = Math.floor((transfer.receivedCount / transfer.chunks.length) * 100);

        // at most ~100 acks per file
        if (progress !== transfer.lastProgress) {

            transfer.lastProgress = progress;

            onProgress?.(transfer.metadata, progress);

            safeSend(dataChannel, {
                type: MESSAGE_TYPES.FILE_PROGRESS,
                fileId,
                receivedChunks: transfer.receivedCount
            });

        }

        return;
    }


    // Control message
    if (typeof message === "string") {

        const data = JSON.parse(message);

        switch (data.type) {

            case MESSAGE_TYPES.FILE_METADATA: {

                if (!Number.isInteger(data.chunkCount) || data.chunkCount < 0) return;

                incomingTransfers.set(
                    data.fileId,
                    {
                        metadata: data,
                        chunks: new Array(data.chunkCount),
                        receivedCount: 0,
                        lastProgress: -1
                    }
                );

                onProgress?.(data, 0);

                break;
            }


            case MESSAGE_TYPES.FILE_CHUNK: {

                pendingChunk = {
                    fileId: data.fileId,
                    chunkIndex: data.chunkIndex
                };

                break;
            }


            case MESSAGE_TYPES.FILE_COMPLETE: {

                const transfer = incomingTransfers.get(
                    data.fileId
                );

                if (!transfer) return;

                try {

                    if (transfer.receivedCount !== transfer.chunks.length) {

                        safeSend(dataChannel, {
                            type: MESSAGE_TYPES.TRANSFER_ERROR,
                            fileId: data.fileId,
                            reason: "incomplete"
                        });

                        onTransferFailed?.(transfer.metadata, "incomplete");

                        return;
                    }

                    try {

                        await onTransferComplete?.(
                            transfer
                        );

                        safeSend(dataChannel, {
                            type: MESSAGE_TYPES.FILE_RECEIVED,
                            fileId: data.fileId
                        });

                    } catch {

                        safeSend(dataChannel, {
                            type: MESSAGE_TYPES.TRANSFER_ERROR,
                            fileId: data.fileId,
                            reason: "decryption-failed"
                        });

                        onTransferFailed?.(transfer.metadata, "decryption-failed");

                    }

                } finally {

                    incomingTransfers.delete(
                        data.fileId
                    );

                }

                break;
            }


            case MESSAGE_TYPES.TRANSFER_CANCEL:
            case MESSAGE_TYPES.TRANSFER_ERROR: {

                const transfer = incomingTransfers.get(data.fileId);

                if (transfer) {
                    onTransferFailed?.(transfer.metadata, data.reason || data.type);
                }

                incomingTransfers.delete(
                    data.fileId
                );

                break;
            }

        }

    }

};
