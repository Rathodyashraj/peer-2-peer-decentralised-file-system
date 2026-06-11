import {Server} from 'socket.io';
import { onlineUsers } from './onlineUsers.js';
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
            onlineUsers.get(userId).socketId.add(socket.id);
        }
        else{
            onlineUsers.set(
                userId,
                {
                    username: socket.user.username,
                    socketId: new Set([socket.id])
                }
            )
        }
        
        
        socket.on('disconnect', () => {

            const userData = onlineUsers.get(userId);

            if(!userData) return;

            userData.socketId.delete(socket.id);

            if(userData.socketId.size == 0) {
                onlineUsers.delete(userId);
            }
            
            onlineUsers.delete(userId);
        
        })
    } )


    return io;
}

