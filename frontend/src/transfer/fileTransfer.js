import { deriveFileKey } from "../crypto/ecdhKeyexchange/sessionKeys";
import { encryptFile } from "../crypto/aes/encryptFile";

const MESSAGE_TYPES = {

    FILE_METADATA: "file-metadata",

    FILE_CHUNK: "file-chunk",

    FILE_COMPLETE: "file-complete",

    TRANSFER_CANCEL: "transfer-cancel",

    TRANSFER_ERROR: "transfer-error"

};

const CHUNK_SIZE = 64 * 1024;





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





export const sendFile = async (file,sessionKeyMaterial,dataChannel) => {

    const fileId = crypto.randomUUID();

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


    dataChannel.send(
        JSON.stringify(metadata)
    );


    for (let i = 0; i < chunks.length; i++) {

        const chunk = chunks[i];

        dataChannel.send(
            JSON.stringify({
                type: MESSAGE_TYPES.FILE_CHUNK,
                fileId,
                chunkIndex: chunk.index
            })
        );

        dataChannel.send(chunk.data);

    }

    dataChannel.send(
        JSON.stringify({
            type: MESSAGE_TYPES.FILE_COMPLETE,
            fileId
        })
    );

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


export const receiveFile = async (message,onTransferComplete) => {

    // Binary chunk
    if (message instanceof ArrayBuffer) {

        if (!pendingChunk) return;

        const {fileId,chunkIndex} = pendingChunk;

        const transfer = incomingTransfers.get(fileId);

        if (!transfer) return;

        transfer.chunks[chunkIndex] = message;

        pendingChunk = null;

        return;
    }


    // Control message
    if (typeof message === "string") {

        const data = JSON.parse(message);

        switch (data.type) {

            case MESSAGE_TYPES.FILE_METADATA: {

                incomingTransfers.set(
                    data.fileId,
                    {
                        metadata: data,
                        chunks: new Array(data.chunkCount)
                    }
                );

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


                await onTransferComplete?.(
                    transfer
                );


                incomingTransfers.delete(
                    data.fileId
                );

                break;
            }


            case MESSAGE_TYPES.TRANSFER_CANCEL: {

                incomingTransfers.delete(
                    data.fileId
                );

                break;
            }


            case MESSAGE_TYPES.TRANSFER_ERROR: {

                incomingTransfers.delete(
                    data.fileId
                );

                break;
            }

        }

    }

};