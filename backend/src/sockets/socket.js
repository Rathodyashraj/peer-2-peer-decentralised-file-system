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

        if(onlineUsers.has(userId)){
            onlineUsers.get(userId).socketIds.add(socket.id);
        }
        else{
            onlineUsers.set(
                userId,
                {
                    username: socket.user.username,
                    socketIds: new Set([socket.id])
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
                    connection.user1 === userId ||
                    connection.user2 === userId
                ) {

                    // notify all sockets of current user
                    const currentUser = onlineUsers.get(userId);

                    if (currentUser) {

                        for (const currentSocketId of currentUser.socketIds) {

                            io.to(currentSocketId).emit(
                                'peer-disconnected'
                            );

                        }

                    }

                    // notify all sockets of peer
                    const otherUserId =
                        connection.user1 === userId
                            ? connection.user2
                            : connection.user1;

                    const otherUser = onlineUsers.get(otherUserId);

                    if (otherUser) {

                        for (const otherSocketId of otherUser.socketIds) {

                            io.to(otherSocketId).emit(
                                'peer-disconnected'
                            );

                        }

                    }

                    activeConnections.delete(connectionKey);

                }

            }

        
            // REMOVE THIS SOCKET
            userData.socketIds.delete(socket.id);


            // PENDING REQUEST CLEANUP
            // (only when last socket disappears)

            if (userData.socketIds.size === 0) {

                for (const requestKey of pendingRequests) {

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

                            for (const otherSocketId of otherUser.socketIds) {

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

