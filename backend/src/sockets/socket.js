import {Server} from 'socket.io';
import { broadCastOnlineUsers, getOnlineUsers, onlineUsers } from './onlineUsers.js';
import { verifySocketJWT } from '../middlewares/socketAuth.middleware.js';
import { handleAcceptRequest, handleConnectionRequest, handleRejectRequest } from './connectionManager.js';
import { pendingRequests } from './pendingRequest.js';
import { activeConnections } from './activeConnections.js';
import { getActiveConnectionBySocket } from '../utils/socketConnection.js';
import { connect } from 'mongoose';
import { getConnectionKey } from '../utils/connectionUtil.js';
import { handleOffer, handleAnswer, handleIceCandidate } from './signalingManager.js';

export const initialiseSocket = (server) => {
    
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    io.use(verifySocketJWT);

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        const deviceId = socket.deviceId;

        if(onlineUsers.has(userId)){
            onlineUsers.get(userId).sockets.set(socket.id,deviceId);
        }
        else{
            onlineUsers.set(
                userId,
                {
                    username: socket.user.username,
                    sockets: new Map([
                        [socket.id, deviceId]
                    ])
                }
            )
        }

        broadCastOnlineUsers(io);
        
        socket.on('get-online-users',() => {

            socket.emit('online-users', getOnlineUsers(userId));
        
        })

        socket.on('connection-request', ({targetUserId}) => {
            //handleConnectionRequest
            handleConnectionRequest(io,socket,targetUserId)
            
        })

        socket.on('accept-request',({requesterUserId}) => {
            handleAcceptRequest(io,socket,requesterUserId);
        })

        socket.on('reject-request',({requesterUserId}) => {
            handleRejectRequest(io,socket,requesterUserId);
        })

        socket.on('challenge', ({challenge,phase}) => {
            
            const connection = getActiveConnectionBySocket(socket.id);

            if (!connection) return;

            const targetSocketId = connection.requester.socketId === socket.id ? connection.acceptor.socketId : connection.requester.socketId;

            io.to(targetSocketId).emit("challenge", {
                challenge,
                phase
            });

        })

        socket.on('challenge-response', ({challenge,signature,phase}) => {

            const connection = getActiveConnectionBySocket(socket.id);

            if (!connection) return;

            const targetSocketId = connection.requester.socketId === socket.id ? connection.acceptor.socketId: connection.requester.socketId;

            

            io.to(targetSocketId).emit("challenge-response", {
                challenge,
                signature,
                phase
            });

        })

        socket.on('authentication-complete',() => {
            const connection = getActiveConnectionBySocket(socket.id);

            if (!connection) return;

            connection.requester.authenticated = true;
            connection.acceptor.authenticated = true;
            connection.state = "authenticated";

            // Notify requester
            io.to(connection.requester.socketId).emit(
                "authentication-complete"
            );

            // Notify acceptor
            io.to(connection.acceptor.socketId).emit(
                "authentication-complete"
            );
        })


        socket.on("authentication-failed", ({ reason }) => {

            const connection = getActiveConnectionBySocket(socket.id);

            if (!connection) return;

            const requesterSocketId = connection.requester.socketId;
            const acceptorSocketId = connection.acceptor.socketId;

            // Notify both participating sockets
            io.to(requesterSocketId).emit(
                "authentication-failed",
                { reason }
            );

            io.to(acceptorSocketId).emit(
                "authentication-failed",
                { reason }
            );

            // Notify remaining requester devices
            const requesterUser = onlineUsers.get(connection.requester.userId);

            if (requesterUser) {

                for (const socketId of requesterUser.sockets.keys()) {

                    if (socketId === requesterSocketId) continue;

                    io.to(socketId).emit(
                        "connection-ended-on-another-device"
                    );

                }

            }

            // Notify remaining acceptor devices
            const acceptorUser = onlineUsers.get(connection.acceptor.userId);

            if (acceptorUser) {

                for (const socketId of acceptorUser.sockets.keys()) {

                    if (socketId === acceptorSocketId) continue;

                    io.to(socketId).emit(
                        "connection-ended-on-another-device"
                    );

                }

            }

            // Remove the connection
            const connectionKey = getConnectionKey(
                connection.requester.userId,
                connection.acceptor.userId
            );

            activeConnections.delete(connectionKey);

        });



        //WebRTC signaling events
        socket.on("webrtc-offer", ({ offer }) => {
            handleOffer(io, socket, offer);
        });

        socket.on("webrtc-answer", ({ answer }) => {
            handleAnswer(io, socket, answer);
        });

        socket.on("webrtc-ice-candidate", ({ candidate }) => {
            handleIceCandidate(io, socket, candidate);
        });














        socket.on('disconnect', () => {

            const userData = onlineUsers.get(userId);

            if (!userData) return;

     
            // ACTIVE CONNECTION CLEANUP
            // (any socket disconnect kills the session)
        
            for (const [connectionKey, connection] of activeConnections) {

                if (
                    connection.requester.socketId === socket.id ||
                    connection.acceptor.socketId === socket.id
                ) {

                    // // notify all sockets of current user
                    // const currentUser = onlineUsers.get(userId);

                    // if (currentUser) {

                    //     for (const currentSocketId of currentUser.sockets.keys()) {

                    //         io.to(currentSocketId).emit(
                    //             'peer-disconnected'
                    //         );

                    //     }

                    // }

                    
                    
                    //notify only one the participating device
                    io.to(connection.requester.socketId).emit(
                        "peer-disconnected"
                    );

                    io.to(connection.acceptor.socketId).emit(
                        "peer-disconnected"
                    );




                    // // notify all sockets of peer
                    // const otherUserId =
                    //     connection.requester.userId === userId
                    //         ? connection.acceptor.userId
                    //         : connection.requester.userId;

                    // const otherUser = onlineUsers.get(otherUserId);

                    // if (otherUser) {

                    //     for (const otherSocketId of otherUser.sockets.keys()) {

                    //         io.to(otherSocketId).emit(
                    //             'peer-disconnected'
                    //         );

                    //     }

                    // }



                    // Notify the remaining requester devices
                    const requesterUser = onlineUsers.get(
                        connection.requester.userId
                    );

                    if (requesterUser) {

                        for (const socketId of requesterUser.sockets.keys()) {

                            if (socketId === connection.requester.socketId)
                                continue;

                            io.to(socketId).emit(
                                "connection-ended-on-another-device"
                            );

                        }

                    }



                    // Notify the remaining acceptor devices
                    const acceptorUser = onlineUsers.get(
                        connection.acceptor.userId
                    );

                    if (acceptorUser) {

                        for (const socketId of acceptorUser.sockets.keys()) {

                            if (socketId === connection.acceptor.socketId)
                                continue;

                            io.to(socketId).emit(
                                "connection-ended-on-another-device"
                            );

                        }

                    }


                    activeConnections.delete(connectionKey);
                    

                }

            }

        
            // REMOVE THIS SOCKET
            userData.sockets.delete(socket.id);


            // PENDING REQUEST CLEANUP
            // (only when last socket disappears)

            if (userData.sockets.size === 0) {

                for (const requestKey of pendingRequests.keys()) {

                    const [senderId, receiverId] =
                        requestKey.split(":");

                    if (
                        senderId === userId ||
                        receiverId === userId
                    ) {

                        pendingRequests.delete(requestKey);

                        const otherUserId =
                            senderId === userId
                                ? receiverId
                                : senderId;

                        const otherUser =
                            onlineUsers.get(otherUserId);

                        if (otherUser) {

                            for (const otherSocketId of otherUser.sockets.keys()) {

                                io.to(otherSocketId).emit(
                                    'request-expired'
                                );

                            }

                        }

                    }

                }

                onlineUsers.delete(userId);

            }

            broadCastOnlineUsers(io);

        });



    } )


    return io;
}

