import dotenv from 'dotenv';
import dns from 'dns';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: './.env',
    quiet: true,
    // debug: true
});


if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });
