const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

export const createPeerConnection = () => {
    return new RTCPeerConnection(configuration);
};

export const closePeerConnection = (peerConnection) => {
    if (!peerConnection) return;

    peerConnection.close();
};

export const getConnectionState = (peerConnection) => {
    return peerConnection.connectionState;
};