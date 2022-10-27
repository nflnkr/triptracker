import { ReturnModelType } from "@typegoose/typegoose";
import { AnyParamConstructor, BeAnObject } from "@typegoose/typegoose/lib/types";
import { HydratedDocument } from "mongoose";
import { PointOfInterest, Track, Trip, User } from "../types/models";
import { placeSchema, tripSchema } from "../types/validators";
import { PlaceNotFoundError, TripNotFoundError, UserNotFoundError } from "./errors";
import { stringsToTrackpoints, trackpointsToStrings } from "./parseTrackpointString";
import { DocumentType } from "@typegoose/typegoose";
import config from "../config/config";


class MongoDbController<T extends AnyParamConstructor<any>> {
    protected model: ReturnModelType<T, BeAnObject>;

    constructor(mongooseModel: ReturnModelType<T, BeAnObject>) {
        this.model = mongooseModel;
    }
}

type DbUser<U extends AnyParamConstructor<any>> = NonNullable<Awaited<HydratedDocument<DocumentType<InstanceType<U>, BeAnObject>, {}, {}>>>;

export class UserDbController<T extends AnyParamConstructor<any>> extends MongoDbController<T> {
    async create(username: string, password: string) {
        const user = await this.model.findOne({ username }).exec();
        if (user) return false;
        const newUser = new this.model({
            username,
            password,
            trips: []
        });
        await newUser.save();
        return true;
    }
    async get(userId: string) {
        const user = await this.model.findById(userId).exec();
        if (!user) throw new UserNotFoundError();
        return user;
    }
    async update(userId: string, newUser: User) {
        const user = await this.model.findById(userId).exec();
        // TODO user info change
    }
    async delete(userId: string) {
        const user = await this.model.findById(userId).exec();
        user?.remove();
    }
}

export class TripDbController<T extends AnyParamConstructor<any>, K extends AnyParamConstructor<any>, U extends AnyParamConstructor<any>> extends MongoDbController<T> {
    private trackDbController: TrackDbController<K>;

    constructor(tripModel: ReturnModelType<T, BeAnObject>, trackModel: ReturnModelType<K, BeAnObject>) {
        super(tripModel);
        this.trackDbController = new TrackDbController(trackModel);
    }
    async create(user: DbUser<U>, trip: Trip) {
        const tripObject = await tripSchema.validate(trip) as Trip;
        const newTrip = new this.model({
            author: user._id,
            name: tripObject.name,
            tracks: []
        });

        await Promise.all(tripObject.tracks.map(async track => {
            const trackpointStrings = trackpointsToStrings(track.trackpoints);
            const newTrackId = await this.trackDbController.create(newTrip._id, trackpointStrings);
            newTrip.tracks.push(newTrackId);
        }));

        user.trips.push(newTrip._id);
        await newTrip.save();
        await user.save();
    }
    async getAllByUserId(userId: string) {
        const dbTrips = await this.model.find({ author: userId }).populate("tracks").exec();
        if (!dbTrips?.length) return null;
        const trips: Trip[] = [];

        dbTrips.forEach(dbTrip => {
            const tracks: Track[] = dbTrip.tracks.map((track: any) => {
                const trackpointsObject = stringsToTrackpoints(track.trackpoints);
                return {
                    type: track.type,
                    color: track.color,
                    trackpoints: trackpointsObject,
                };
            });
            const trip: Trip = {
                _id: dbTrip._id,
                name: dbTrip.name,
                tracks,
            };
            trips.push(trip);
        });

        return trips;
    }
    async get(tripId: string) {
        const trip = await this.model.findOne({ _id: tripId }).populate("tracks").exec();
        if (!trip) throw new TripNotFoundError();

        const tracks: Track[] = trip.tracks.map((track: any) => {
            const trackpointsObject = stringsToTrackpoints(track.trackpoints);
            const trackObj: Track = {
                type: track.type,
                color: track.color,
                trackpoints: trackpointsObject
            };
            return trackObj;
        });
        const tripObject: Trip = {
            _id: trip._id,
            name: trip.name,
            tracks: tracks.sort((a, b) => a.trackpoints[0].time - b.trackpoints[0].time),
        };

        return tripObject;
    }
    async update(tripId: string, newTrip: Trip) {
        const updatedTrip = await tripSchema.validate(newTrip) as Trip;
        const trip = await this.model.findById(tripId).exec();
        if (!trip) throw new TripNotFoundError();

        trip.name = updatedTrip.name;
        trip.tracks = [] as any;
        await this.trackDbController.deleteByTripId(trip._id);

        await Promise.all(updatedTrip.tracks.map(async track => {
            const trackpointStrings = trackpointsToStrings(track.trackpoints);
            const newTrackId = await this.trackDbController.create(trip._id, trackpointStrings, track.type, track.color);
            trip.tracks.push(newTrackId);
        }));

        await trip.save();
    }
    async delete(user: DbUser<U>, tripId: string) {
        user.trips.remove(tripId);
        const trip = await this.model.findById(tripId).exec();
        trip?.remove();
        await user.save();
    }
}

class TrackDbController<T extends AnyParamConstructor<any>> extends MongoDbController<T> {
    async create(
        tripId: string,
        trackpoints: string[],
        type: string = config.trackDefaults.type,
        color: string = config.trackDefaults.color
    ) {
        const newTrack = await this.model.create({
            parentTrip: tripId,
            type,
            color,
            trackpoints
        });
        return newTrack._id as string;
    }
    async deleteByTripId(tripId: string) {
        await this.model.deleteMany({ parentTrip: tripId }).exec();
    }
}

export class PlaceDbController<T extends AnyParamConstructor<any>, U extends AnyParamConstructor<any>> extends MongoDbController<T> {
    async create(user: DbUser<U>, place: PointOfInterest) {
        const newPlace = new this.model({
            author: user._id,
            name: place.name,
            description: place.description || "",
            lat: place.lat,
            lon: place.lon,
        });
        user.places.push(newPlace._id);
        await newPlace.save();
        await user.save();
        return {
            lat: newPlace.lat,
            lon: newPlace.lon,
            name: newPlace.name,
            description: newPlace.description,
            id: newPlace._id,
            createdAt: newPlace.createdAt.getTime()
        };
    }
    async getAllByUserId(userId: string) {
        const places = await this.model.find({ author: userId }).exec();
        if (!places?.length) throw new PlaceNotFoundError();

        const returnPlaces: PointOfInterest[] = places.map(place => ({
            id: place._id,
            createdAt: place.createdAt,
            name: place.name,
            description: place.description,
            lat: place.lat,
            lon: place.lon,
        }));

        return returnPlaces;
    }
    async update(placeId: string, updatedPlace: PointOfInterest) {
        const validatedPlace = await placeSchema.validate(updatedPlace) as PointOfInterest;
        const place = await this.model.findById(placeId);
        if (!place) throw new PlaceNotFoundError();

        place.name = validatedPlace.name || "";
        place.description = validatedPlace.description || "";
        place.lat = validatedPlace.lat;
        place.lon = validatedPlace.lon;

        await place.save();
    }
    async delete(user: DbUser<U>, placeId: string) {
        const place = this.model.findById(placeId);
        user.places.remove(placeId);
        place?.remove();
        await user.save();
    }
}
