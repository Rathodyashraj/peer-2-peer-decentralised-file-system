export const registerIceCandidate = (peerConnection,onIceCandidate) => {

    peerConnection.onicecandidate = (event) => {

        if (event.candidate) {
            onIceCandidate(event.candidate);
        }

    };

};


export const addRemoteIceCandidate = async (peerConnection,candidate) => {
    await peerConnection.addIceCandidate(candidate);
};


