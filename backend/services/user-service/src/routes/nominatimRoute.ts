import express, { Request, Response } from "express";
import { nominatimController } from "../controller/nominatimController";


const nominatimRoute = express.Router();


nominatimRoute.get("/search", nominatimController.search);
nominatimRoute.get("/reverse", nominatimController.reverse);

export default nominatimRoute