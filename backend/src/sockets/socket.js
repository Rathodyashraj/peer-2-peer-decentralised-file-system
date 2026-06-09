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

        onlineUsers.set(
            userId,
            {
                username: socket.user.username,
                socketId: socket.id
            }
        )
        
        socket.on('disconnect', () => {
            const user = onlineUsers.get(userId);
            onlineUsers.delete(userId);
        
        })
    } )


    return io;
}

