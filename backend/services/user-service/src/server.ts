import express from 'express';
import authRoute from './routes/authRoute';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import agentRoute from './routes/agentRoute';
import builderRouter from './routes/builderRoute';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT ?? 4004;
        

async function start() {
    try {
        await connectDB();

        app.get("/", (req, res) => {
           res.json({ message: "User Service is running" });
        });

        app.use('/auth', authRoute);
        app.use("/agent", agentRoute);
        app.use("/builder", builderRouter);
        
        app.listen(port, () => {
            console.log(`user service is running on port ${port}`); 
        });
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}
start();