import  express  from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import PropertiesRoute from "./routes/propertiesRoute";
import featurePropertiesRoute from "./routes/featurePropertiesRoute";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT ?? 4003;

async function start() {
    try {
        await connectDB(); 
        app.get("/", (req, res) => {
           res.json({ message: "Property Service is running" });
        });
        

        app.use('/api/properties', PropertiesRoute);
app.use('/api/properties/featuredProject', featurePropertiesRoute);

        app.listen(port, () => {
            console.log(`property service is running on port ${port}`); 
        });
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();