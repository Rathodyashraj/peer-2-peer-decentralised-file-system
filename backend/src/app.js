import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes/user.routes.js';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(cookieParser()); // for storing secure cookies
app.use(express.json()) // middleware for parsing incoming requests with json payload and makes data available in req.body
app.use(express.urlencoded({extended: true})) // middleware that parses incoming req with url encoded payloads and makes data available in req.body




app.use("/",router);

export {app}