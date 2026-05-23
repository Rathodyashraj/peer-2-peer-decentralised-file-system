import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});

const {app} = await import('./app.js');
import connectDB from './db/index.js'

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000,() => {
        console.log(`server listening on http://localhost:${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection failed !!!!!",err);
})

