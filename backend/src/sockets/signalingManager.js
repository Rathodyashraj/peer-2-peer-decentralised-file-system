import { getActiveConnectionBySocket } from "../utils/socketConnection.js";

const getTargetSocketId = (connection, socketId) => connection.requester.socketId === socketId ? connection.acceptor.socketId : connection.requester.socketId


export const handleOffer = (io, socket, offer) => {

    const connection = getActiveConnectionBySocket(socket.id);

    if (!connection) return;

    if (connection.state !== "authenticated") return;

    const targetSocketId = getTargetSocketId(connection,socket.id);

    io.to(targetSocketId).emit("webrtc-offer",{ offer });

};


export const handleAnswer = (io, socket, answer) => {

    const connection = getActiveConnectionBySocket(socket.id);

    if (!connection) return;

    if (connection.state !== "authenticated") return;

    const targetSocketId = getTargetSocketId(connection,socket.id);

    io.to(targetSocketId).emit("webrtc-answer",{ answer });

};


export const handleIceCandidate = (io, socket, candidate) => {

    const connection = getActiveConnectionBySocket(socket.id);

    if (!connection) return;

    if (connection.state !== "authenticated") return;

    const targetSocketId = getTargetSocketId(connection,socket.id);

    io.to(targetSocketId).emit("webrtc-ice-candidate",{ candidate });

};