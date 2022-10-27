import { array, object, string, SchemaOf, number, mixed } from "yup";
import { PointOfInterest, Track, TrackPoint, TrackType, trackTypes, Trip, TripMeta, User } from "./models";

const trackPointSchema: SchemaOf<TrackPoint> = object({
    lat: number().defined(),
    lon: number().defined(),
    ele: number().defined(),
    time: number().defined(),
}).strict(true).noUnknown();

const trackSchema: SchemaOf<Track> = object({
    type: mixed<TrackType>().oneOf([...trackTypes]).defined(),
    color: string().defined(),
    trackpoints: array().of(trackPointSchema),
}).strict(true).noUnknown();

export const tripSchema: SchemaOf<Trip> = object({
    _id: string().defined(),
    name: string().defined(),
    tracks: array().of(trackSchema),
}).strict(true).noUnknown();

const tripMetaSchema: SchemaOf<TripMeta> = object({
    _id: string().defined(),
    name: string().defined(),
}).strict(true).noUnknown();

export const placeSchema: SchemaOf<PointOfInterest> = object({
    name: string().optional(),
    description: string().optional(),
    lat: number().defined(),
    lon: number().defined(),
    id: string().optional(),
    createdAt: number().optional(),
}).strict(true).noUnknown();

const userSchema: SchemaOf<User> = object({
    username: string().defined(),
    trips: array().of(tripMetaSchema).defined(),
    places: array().of(placeSchema).defined(),
}).strict(true).noUnknown();