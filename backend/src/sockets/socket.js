import {Server} from 'socket.io';

export const initialiseSocket = (server) => {
    
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('a user connected with id : ', socket.id);
        
        socket.on('disconnect', () => {
            console.log('user disconnected with id : ', socket.id);
        })
    } )


    return io;
}

