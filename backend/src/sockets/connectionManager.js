import { getOnlineUsers, onlineUsers } from "./onlineUsers.js";
import { pendingRequests } from "./pendingRequest.js";
import { activeConnections, isUserBusy} from "./activeConnections.js";
import { getConnectionKey } from "../utils/connectionUtil.js";
import { User } from "../models/user.models.js";


export const handleConnectionRequest = (io,socket,targetUserId) => {

    const requesterUserId = socket.user._id.toString();
    const requesterUsername = socket.user.username;

    if (isUserBusy(requesterUserId)) {
        socket.emit("connection-request-failed", {
            message: "You are already connected to another peer."
        });
        return;
    }

    if (isUserBusy(targetUserId)) {
        socket.emit("connection-request-failed", {
            message: "User is already connected."
        });
        return;

    }

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
    pendingRequests.set(requestKey,{
        requesterUserId,
        requesterSocketId: socket.id,
        requesterDeviceId: socket.deviceId,
        targetUserId
    });

    //send request to all the sockets of target user from the requesting cuurent user
    for(const socketId of targetUser.sockets.keys()){
        io.to(socketId).emit('incoming-connection-request',
            {
                requesterUserId, /////////
                requesterUsername
            }
        )
    }

    
}


export const handleAcceptRequest = async(io,socket,requesterUserId) => {

    const acceptorUserId = socket.user._id.toString();
    const acceptorUsername = socket.user.username;

    const requestKey = `${requesterUserId}:${acceptorUserId}`;

    // stale request
    if (!pendingRequests.has(requestKey)) {

        socket.emit('request-expired');

        return;
    }


    const pendingRequest = pendingRequests.get(requestKey);

    // remove pending request
    pendingRequests.delete(requestKey);


    const connectionKey = getConnectionKey(requesterUserId,acceptorUserId);
    activeConnections.set(
        connectionKey,
        {
            requester: {
                userId: requesterUserId,
                socketId: pendingRequest.requesterSocketId,
                deviceId: pendingRequest.requesterDeviceId,
                authenticated: false
            },
            acceptor: {
                userId: acceptorUserId,
                socketId: socket.id,
                deviceId: socket.deviceId,
                authenticated: false
            },
            state: "pending-authentication"
        }
    );

    //fetching public key
    const requester = await User.findById(requesterUserId).select("devices");
    const accepter = await User.findById(acceptorUserId).select("devices");



    const requesterDevice = requester.devices.find(device => device.deviceId === pendingRequest.requesterDeviceId )
    const accepterDevice = accepter.devices.find(device => device.deviceId === socket.deviceId )

    const requesterUser = onlineUsers.get(requesterUserId);

    // requester went offline
    if (!requesterUser) {
        return;
    }

    // notify requester (only one which connected)
    io.to(pendingRequest.requesterSocketId).emit(
        "connection-accepted",
        {
            peerUserId: acceptorUserId,
            peerUsername: acceptorUsername,
            peerPublicKey: accepterDevice.publicKey
        }
    )

    ///notify remaining requesters
    for (const socketId of requesterUser.sockets.keys()) {
        if (socketId === pendingRequest.requesterSocketId) continue;

        io.to(socketId).emit(
            "connected-on-another-device",
            {
                peerUserId: acceptorUserId,
                peerUsername: acceptorUsername
            }
        );

    }


    //notify to one that accepted
    io.to(socket.id).emit(
        "connection-established",
        {
            peerUserId: requesterUserId,
            peerUsername: requesterUser.username,
            peerPublicKey: requesterDevice.publicKey
        }
    )


    // notify to remaining acceptors
    const acceptorUser = onlineUsers.get(acceptorUserId);

    for(const socketId of acceptorUser.sockets.keys()) {
        if(socketId === socket.id) continue;

        io.to(socketId).emit(
            "connected-on-another-device",
            {
                peerUserId: requesterUserId,
                peerUsername: requesterUser.username
            }
        );
    }
    

}


export const handleRejectRequest = (io,socket,requesterUserId) => {

    const rejectorUserId = socket.user._id.toString();
    const rejectorUsername = socket.user.username;

    const requestKey = `${requesterUserId}:${rejectorUserId}`;

    // stale request
    if (!pendingRequests.has(requestKey)) {
        socket.emit('request-expired');
        return;
    }

    // remove pending request
    pendingRequests.delete(requestKey);

    const requesterUser = onlineUsers.get(requesterUserId);

    if (!requesterUser) {
        return;
    }

    // notify requester
    for (const socketId of requesterUser.sockets.keys()) {

        io.to(socketId).emit(
            "connection-rejected",
            {
                peerUsername: rejectorUsername
            }
        );


    }

    socket.emit('request-rejected');
}

