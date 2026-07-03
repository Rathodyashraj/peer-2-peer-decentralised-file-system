export const createOffer = async (peerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return offer;
};


export const createAnswer = async (peerConnection) => {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
};


export const setRemoteOffer = async (peerConnection,offer) => {

    await peerConnection.setRemoteDescription(offer);

};


export const setRemoteAnswer = async (peerConnection,answer) => {

    await peerConnection.setRemoteDescription(answer);

};