import { NextFunction, Request, Response } from "express";
import TrackModel from "../models/track";
import TripModel from "../models/trip";
import UserModel from "../models/user";
import type { Track, TrackPoint, Trip } from "../types/models";
import { getUniqueTrackpoints } from "../utils/getUniqueTrackpoints";
import { trackpointsToStrings } from "../utils/parseTrackpointString";
import { xmlTrackpointsFromFile } from "../utils/xmlTrackpointsFromFile";

async function uploadGpx(req: Request, res: Response, next: NextFunction) {
    const username = req.user?.username;
    const tripname = req.body.name;
    const sameTrip = req.body.sameTrip;
    // TODO check trip name
    if (!username) return res.status(500).json({ error: "User not found" });
    if (!tripname) return res.status(500).json({ error: "Wrong tripname" });
    if (!req.files || !req.files.length) return res.status(500).json({ error: "No file received" });
    // TODO upload multiple files
    try {
        const files = req.files;
        if (!Array.isArray(files)) throw new Error("'files' is not an array");

        const user = await UserModel.findOne({ username }).exec();
        if (user === null) return res.status(404).json({ error: "User not found" });

        const returnTrips: Trip[] = [];

        if (sameTrip === "true") {
            const trip = new TripModel({
                author: user._id,
                name: tripname,
                tracks: [],
            });

            const returnTracks: Track[] = [];

            for (let file of files) {
                const xmlTrackpoints = xmlTrackpointsFromFile(file);

                let trackpoints: TrackPoint[] = xmlTrackpoints.map(trackpoint => {
                    const lat = Number(trackpoint["_lat"]);
                    const lon = Number(trackpoint["_lon"]);
                    const ele = Number(trackpoint["ele"]);
                    const time = Date.parse(trackpoint["time"]);
                    if (isNaN(time)) throw new Error(`Cannot parse time: ${trackpoint["time"]}`);
                    return { lat, lon, ele, time };
                });

                trackpoints = getUniqueTrackpoints(trackpoints);
                const stringTrackpoints = trackpointsToStrings(trackpoints);

                const track = await TrackModel.create({
                    parentTrip: trip._id,
                    // type: "other",
                    // color: "#535cd4ff",
                    trackpoints: stringTrackpoints,
                });

                const returnTrack: Track = {
                    type: "other",
                    color: "#535cd4ff",
                    trackpoints: trackpoints
                };

                returnTracks.push(returnTrack);

                trip.tracks.push(track._id);
            }

            const returnTrip: Trip = {
                _id: trip._id,
                name: tripname,
                tracks: returnTracks
            };

            returnTrips.push(returnTrip);
            user.trips.push(trip._id);
            await trip.save();
        } else {
            let tripIndex = 1;
            for (let file of files) {
                const xmlTrackpoints = xmlTrackpointsFromFile(file);

                let trackpoints: TrackPoint[] = xmlTrackpoints.map(trackpoint => {
                    const lat = Number(trackpoint["_lat"]);
                    const lon = Number(trackpoint["_lon"]);
                    const ele = Number(trackpoint["ele"]);
                    const time = Date.parse(trackpoint["time"]);
                    if (isNaN(time)) throw new Error(`Cannot parse time: ${trackpoint["time"]}`);
                    return { lat, lon, ele, time };
                });

                trackpoints = getUniqueTrackpoints(trackpoints);

                const trip = new TripModel({
                    author: user._id,
                    name: files.length > 1 ? `${tripname} ${tripIndex++}` : tripname,
                    tracks: [],
                });

                const track = await TrackModel.create({
                    parentTrip: trip._id,
                    // type: "other",
                    // color: "#535cd4ff",
                    trackpoints: trackpointsToStrings(trackpoints),
                });

                const returnTrip: Trip = {
                    _id: trip._id,
                    name: tripname,
                    tracks: [{
                        type: "other",
                        color: "#535cd4ff",
                        trackpoints
                    }],
                };

                returnTrips.push(returnTrip);
                trip.tracks.push(track);
                user.trips.push(trip._id);
                await trip.save();
            }
        }
        await user.save();

        res.status(200).json({ success: true, trips: returnTrips });
    } catch (error) {
        next(error);
    }
}

async function downloadGpx(req: Request, res: Response, next: NextFunction) {
    res.status(500).json({ error: "not implemented" });
}

export default {
    uploadGpx,
    downloadGpx
};