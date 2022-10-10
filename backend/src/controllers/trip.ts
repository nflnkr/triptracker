import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import TrackModel from "../models/track";
import TripModel from "../models/trip";
import UserModel from "../models/user";
import type { Track, TrackPoint, Trip } from "../types/models";
import { tripSchema } from "../types/validators";
import { stringsToTrackpoints, trackpointsToStrings } from "../utils/parseTrackpointString";

// TODO
async function createTrip(req: Request, res: Response, next: NextFunction) {
    const username = req.body.username;
    const tripObject = req.body.trip as Trip;
    // TODO check parameters
    // TODO validate trip object
    try {
        const user = await UserModel.findOne({ username }).exec();
        if (user === null) return res.status(404).json({ error: "User not found" });

        const newTrip = new TripModel({
            author: user._id,
            name: tripObject.name,
            tracks: []
        });

        await Promise.all(tripObject.tracks.map(async track => {
            const trackpointStrings = track.trackpoints.map(trackpoint => `${trackpoint.lat.toFixed(6)}/${trackpoint.lon.toFixed(6)}/${trackpoint.ele.toFixed(1)}/${trackpoint.time}`);
            const newTrack = await TrackModel.create({
                parentTrip: newTrip._id,
                // type: "unknown", // TODO
                // color: "#535cd4ff", // TODO
                trackpoints: trackpointStrings
            });
            newTrip.tracks.push(newTrack._id);
        }));

        user.trips.push(newTrip._id);
        await newTrip.save();
        await user.save();
        return res.status(201).json({ message: "Trip added successfully" });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function getTripsByUsername(req: Request, res: Response, next: NextFunction) {
    const userId = req.session.passport.user;
    if (!userId) return res.status(404).json({ error: "User not found" });

    try {
        const trips = await TripModel.find({ author: userId }).populate("tracks").exec();
        const returnTrips: Trip[] = [];

        trips.forEach(trip => {
            const tracks: Track[] = trip.tracks.map((track: any) => {
                const trackpointsObject = stringsToTrackpoints(track.trackpoints);
                return {
                    type: track.type,
                    color: track.color,
                    trackpoints: trackpointsObject,
                };
            });
            const tripObject: Trip = {
                _id: trip._id,
                name: trip.name,
                tracks,
            };
            returnTrips.push(tripObject);
        });

        return res.status(200).json({ trips: returnTrips });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function getTripById(req: Request, res: Response, next: NextFunction) {
    const tripId = req.params.tripId;
    try {
        const trip = await TripModel.findOne({ _id: tripId }).populate("tracks").exec();
        if (trip === null) return res.status(404).json({ error: "Trip not found" });

        const tracks: Track[] = trip.tracks.map((track: any) => {
            const trackpointsObject = stringsToTrackpoints(track.trackpoints);
            return {
                type: track.type,
                color: track.color,
                trackpoints: trackpointsObject,
            };
        });
        const tripObject: Trip = {
            _id: trip._id,
            name: trip.name,
            tracks: tracks.sort((a, b) => a.trackpoints[0].time - b.trackpoints[0].time),
        };
        return res.status(200).json({ trip: tripObject });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function updateTripById(req: Request, res: Response, next: NextFunction) {
    const tripId = req.params.tripId;
    let updatedTrip = req.body.trip as Trip; // TODO validate trip object
    try {
        const time = performance.now();
        updatedTrip = await tripSchema.validate(updatedTrip) as Trip;
        const validationTime = `${(performance.now() - time).toFixed(0)} ms`;

        const trip = await TripModel.findOne({ _id: tripId }).exec();
        if (trip === null) return res.status(404).json({ error: "Trip not found" });
        trip.name = updatedTrip.name;

        trip.tracks = [] as any;
        await TrackModel.deleteMany({ parentTrip: trip._id }).exec();

        await Promise.all(updatedTrip.tracks.map(async track => {
            const trackpointStrings = trackpointsToStrings(track.trackpoints);
            const newTrack = await TrackModel.create({
                parentTrip: trip._id,
                type: track.type || config.trackDefaults.type,
                color: track.color || config.trackDefaults.color,
                trackpoints: trackpointStrings
            });
            trip.tracks.push(newTrack._id);
        }));

        await trip.save();
        return res.status(201).json({ success: true, validationTime });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

async function deleteTripById(req: Request, res: Response, next: NextFunction) {
    const username = (req.user as any)?.username;
    if (!username) return res.status(500).json({ error: "No user specified" });
    const tripId = req.params.tripId;
    try {
        const user = await UserModel.findOne({ username }).exec();
        if (user === null) return res.status(500).json({ error: "User not found" });
        user.trips.remove(tripId);
        const trip = await TripModel.findOne({ _id: tripId }).exec();
        trip?.remove();
        await user.save();
        return res.status(200).json({ success: true, result: "Trip removed" });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

export default {
    getTripsByUsername,
    deleteTripById,
    createTrip,
    updateTripById,
    getTripById
};