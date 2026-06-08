import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});

const {app} = await import('./app.js');
import connectDB from './db/index.js'
import {initialiseSocket} from './sockets/socket.js';
import http from 'http';


connectDB()
.then(() => {
    // create http server
    const server = http.createServer(app);
    // mount socket.io on the http server
    const io = initialiseSocket(server);

    server.listen(process.env.PORT || 8000,() => {
        console.log(`server listening on http://localhost:${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection failed !!!!!",err);
})

