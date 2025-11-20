import express, { Request, Response } from "express";
import { nominatimController } from "../controller/nominatimController";


const nominatimRoute = express.Router();


nominatimRoute.get("/search", nominatimController.search);
nominatimRoute.get("/reverse", nominatimController.reverse);


// NEW:
nominatimRoute.get("/nearby", nominatimController.nearbyByCoords);       // use lat/lon
nominatimRoute.get("/nearby-by-city", nominatimController.nearbyByCity); // use q=cityName

export default nominatimRoute