import express from "express";
import {  getAllLocations, postLocation } from "../controller/nominatimController";


const nominatimRoute = express.Router();

nominatimRoute.post("/", postLocation);

// nominatimRoute.get("/search", SearchLocation);
nominatimRoute.get("/", getAllLocations);   



export default nominatimRoute