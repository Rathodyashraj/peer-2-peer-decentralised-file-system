import { onlineUsers } from "./onlineUsers.js";
import { pendingRequests } from "./pendingRequest.js";
import { activeConnections } from "./activeConnections.js";
import { getConnectionKey } from "../utils/connectionUtil.js";


export const handleConnectionRequest = (io,socket,targetUserId) => {

    const requesterUserId = socket.user._id.toString();
    const requesterUsername = socket.user.username;

    const connectionKey = getConnectionKey(requesterUserId,targetUserId);

    if (activeConnections.has(connectionKey)) {

        socket.emit(
            "connection-request-failed",
            {
                message: "Already connected"
            }
        );

        return;

    }

    if(requesterUserId === targetUserId) return;

    const requestKey = `${requesterUserId}:${targetUserId}`;


    if(pendingRequests.has(requestKey)){
        socket.emit('connection-request-failed',
            {
                message: "Connection Request still pending"
            }
        );

        return;
    }

    const targetUser = onlineUsers.get(targetUserId);
    // if target is offline
    if(!targetUser){


        socket.emit('connection-request-failed',
            {
                message: "User is offline"
            }
        );

        return;
    }

    //else save request
    pendingRequests.add(requestKey);

    //send request to all the sockets of target user from the requesting cuurent user
    for(const socketId of targetUser.socketIds){
        io.to(socketId).emit('incoming-connection-request',
            {
                requesterUserId, /////////
                requesterUsername
            }
        )
    }

    
}


export const handleAcceptRequest = (io,socket,requesterUserId) => {

    const acceptorUserId = socket.user._id.toString();
    const acceptorUsername = socket.user.username;

    const requestKey = `${requesterUserId}:${acceptorUserId}`;

    // stale request
    if (!pendingRequests.has(requestKey)) {
        return;
    }



    // remove pending request
    pendingRequests.delete(requestKey);


    const connectionKey = getConnectionKey(requesterUserId,acceptorUserId);
    activeConnections.add(connectionKey);


    const requesterUser = onlineUsers.get(requesterUserId);

    // requester went offline
    if (!requesterUser) {
        return;
    }

    // notify requester (all sessions)
    for (const socketId of requesterUser.socketIds) {

        io.to(socketId).emit(
            "connection-accepted",
            {
                peerUserId: acceptorUserId, /////////
                peerUsername: acceptorUsername
            }
        );

    }

    // notify acceptor
    socket.emit(
        "connection-established",
        {
            peerUserId: requesterUserId,
            peerUsername: requesterUser.username
        }
    );

}


export const handleRejectRequest = (io,socket,requesterUserId) => {

    const rejectorUserId = socket.user._id.toString();
    const rejectorUsername = socket.user.username;

    const requestKey = `${requesterUserId}:${rejectorUserId}`;

    // stale request
    if (!pendingRequests.has(requestKey)) {
        return;
    }

    // remove pending request
    pendingRequests.delete(requestKey);

    const requesterUser = onlineUsers.get(requesterUserId);

    if (!requesterUser) {
        return;
    }

    // notify requester
    for (const socketId of requesterUser.socketIds) {

        io.to(socketId).emit(
            "connection-rejected",
            {
                peerUsername: rejectorUsername
            }
        );

        socket.emit('request-rejected');

    }

}

