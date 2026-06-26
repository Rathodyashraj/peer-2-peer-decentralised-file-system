import {Server} from 'socket.io';
import { broadCastOnlineUsers, getOnlineUsers, onlineUsers } from './onlineUsers.js';
import { verifySocketJWT } from '../middlewares/socketAuth.middleware.js';
import { handleAcceptRequest, handleConnectionRequest, handleRejectRequest } from './connectionManager.js';
import { pendingRequests } from './pendingRequest.js';
import { activeConnections } from './activeConnections.js';

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



        
        // socket.on('disconnect', () => {

        //     const userData = onlineUsers.get(userId);

        //     if(!userData) return;

        //     userData.socketIds.delete(socket.id);

        //     if(userData.socketIds.size == 0) {

        //         for(const requestKey of pendingRequests){
        //             const [senderId,recieverId] = requestKey.split(":")

        //             if(senderId === userId || recieverId === userId){
        //                 pendingRequests.delete(requestKey);
        //             }


        //             const otherUserId = senderId === userId ? recieverId: senderId;

        //             const otherUser = onlineUsers.get(otherUserId);

        //             if(otherUser){
        //                 for(const socketId of otherUser.socketIds){
        //                     io.to(socketId).emit('request-expired');
        //                 }
        //             }


        //         }


        //         for(const [connectionKey,connection] of activeConnections){
        //             if(connection.user1 === userId || connection.user2 === userId){
        //                 const otherUserId = connection.user1 === userId ? connection.user2: connection.user1;

        //                 const otherUser = onlineUsers.get(otherUserId);

        //                 if(otherUser){
        //                     for(const socketId of otherUser.socketIds){
        //                         io.to(socketId).emit('peer-disconnected');
        //                     }
        //                 }

        //                 activeConnections.delete(connectionKey);
        //             }
        //         }

        //         onlineUsers.delete(userId);
        //     }
            
        //     // onlineUsers.delete(userId);
        //     broadCastOnlineUsers(io);
        
        // })


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

