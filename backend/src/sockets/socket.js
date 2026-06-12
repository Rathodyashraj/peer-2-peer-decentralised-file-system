import {Server} from 'socket.io';
import { broadCastOnlineUsers, getOnlineUsers, onlineUsers } from './onlineUsers.js';
import { verifySocketJWT } from '../middlewares/socketAuth.middleware.js';

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


        
        socket.on('disconnect', () => {

            const userData = onlineUsers.get(userId);

            if(!userData) return;

            userData.socketIds.delete(socket.id);

            if(userData.socketIds.size == 0) {
                onlineUsers.delete(userId);
            }
            
            // onlineUsers.delete(userId);
            broadCastOnlineUsers(io);
        
        })
    } )


    return io;
}

