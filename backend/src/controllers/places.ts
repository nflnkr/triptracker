import { Request, Response, NextFunction } from "express";
import createValidation from "yup/lib/util/createValidation";
import config from "../config/config";
import PlaceModel from "../models/place";
import TrackModel from "../models/track";
import TripModel from "../models/trip";
import UserModel from "../models/user";
import type { PointOfInterest, Track, TrackPoint, Trip } from "../types/models";
import { tripSchema } from "../types/validators";
import { stringsToTrackpoints, trackpointsToStrings } from "../utils/parseTrackpointString";

async function createPlace(req: Request, res: Response, next: NextFunction) {
    const username = req.user?.username;
    if (!username) return res.status(404).json({ error: "Username not found" });
    const place = req.body.place as PointOfInterest;
    try {
        const user = await UserModel.findOne({ username }).exec();
        if (user === null) return res.status(404).json({ error: "User not found" });

        const newPlace = new PlaceModel({
            author: user._id,
            name: place.name,
            description: place.description || "",
            lat: place.lat,
            lon: place.lon,
        });

        user.places.push(newPlace._id);
        await newPlace.save();
        await user.save();
        return res.status(201).json({
            success: true,
            place: {
                lat: newPlace.lat,
                lon: newPlace.lon,
                name: newPlace.name,
                description: newPlace.description,
                id: newPlace._id,
                createdAt: newPlace.createdAt.getTime()
            }
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function getPlaces(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    if (!userId) return res.status(404).json({ error: "User not found" });

    try {
        const places = await PlaceModel.find({ author: userId }).exec();
        const returnPlaces = places.map(place => ({
            id: place._id,
            lat: place.lat,
            lon: place.lon,
            name: place.name,
            description: place.description,
            createdAt: place.createdAt
        }));

        return res.status(200).json({ places: returnPlaces });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function updatePlace(req: Request, res: Response, next: NextFunction) {
    const placeId = req.params.placeId;
    let updatedPlace = req.body.trip as PointOfInterest;
    try {
        const place = await PlaceModel.findOne({ _id: placeId }).exec();
        if (place === null) return res.status(404).json({ error: "Place not found" });

        place.name = updatedPlace.name || "";
        place.description = updatedPlace.description || "";
        place.lat = updatedPlace.lat;
        place.lon = updatedPlace.lon;

        await place.save();
        return res.status(201).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function deletePlace(req: Request, res: Response, next: NextFunction) {
    const username = req.user?.username;
    if (!username) return res.status(500).json({ error: "No user specified" });
    const placeId = req.params.placeId;
    try {
        const user = await UserModel.findOne({ username }).exec();
        if (user === null) return res.status(500).json({ error: "User not found" });
        user.places.remove(placeId);
        const place = await PlaceModel.findOne({ _id: placeId }).exec();
        place?.remove();
        await user.save();
        return res.status(200).json({ success: true, result: "Place removed" });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

export default {
    deletePlace,
    getPlaces,
    createPlace,
    updatePlace,
};