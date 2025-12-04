import express from 'express';
import authRoute from './routes/authRoute';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import agentRoute from './routes/agentRoute';
import nominatimRoute from './routes/nominatimRoute';


dotenv.config();


dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const port = process.env.PORT ?? 4004;
        
async function start() { 
    try {
        await connectDB();

        app.get("/", (req, res) => {
           res.json({ message: "User Service is running" });
        });

        app.use('/api/users/auth', authRoute);
        app.use("/api/users/agent", agentRoute);
        // app.use("/api/users/builder", builderRouter);
        app.use("/api/users/locations", nominatimRoute);

        app.listen(Number(port), "0.0.0.0", () => {
          console.log(`user service running on 0.0.0.0:${port}`);
        });

        
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}
start();