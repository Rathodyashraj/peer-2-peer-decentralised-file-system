export const createDataChannel = (peerConnection) => {
    return peerConnection.createDataChannel("file-transfer");
}

export const registerDataChannelEvents = ( dataChannel,{ onOpen,onMessage,onClose,onError }) => {

    dataChannel.onopen = () => {

        console.log("Data channel opened.");

        onOpen?.();

    };


    dataChannel.onmessage = (event) => {

        onMessage?.(event.data);

    };


    dataChannel.onclose = () => {

        console.log("Data channel closed.");

        onClose?.();

    };


    dataChannel.onerror = (error) => {

        console.error("Data channel error:", error);

        onError?.(error);

    };

};


export const registerIncomingDataChannel = (peerConnection,dataChannelRef,handlers) => {

    peerConnection.ondatachannel = (event) => {

        dataChannelRef.current = event.channel;

        registerDataChannelEvents(
            event.channel,
            handlers
        );

    };

};