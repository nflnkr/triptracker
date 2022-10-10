import { array, object, string, SchemaOf, number } from "yup";
import { Track, TrackPoint, Trip, TripMeta, User } from "./models";

/* export const trackPointSchema: SchemaOf<TrackPoint> = object({
    lat: number().defined(),
    lon: number().defined(),
    ele: number().defined(),
    time: number().defined(),
}).strict(true).noUnknown();

export const trackSchema: SchemaOf<Track> = object({
    trackpoints: array().of(trackPointSchema),
    startDate: number().defined(),
    endDate: number().defined(),
    totalDistance: number().defined(),
    maxSpeed: number().defined(),
    avgSpeed: number().defined(),
}).strict(true).noUnknown();

export const tripSchema: SchemaOf<Trip> = object({
    _id: string().defined(),
    name: string().defined(),
    startDate: number().defined(),
    endDate: number().defined(),
    totalDistance: number().defined(),
    maxSpeed: number().defined(),
    avgSpeed: number().defined(),
    tracks: array().of(trackSchema),
}).strict(true).noUnknown();

export const tripMetaSchema: SchemaOf<TripMeta> = object({
    _id: string().defined(),
    name: string().defined(),
    startDate: number().defined(),
    endDate: number().defined(),
    totalDistance: number().defined(),
    maxSpeed: number().defined(),
    avgSpeed: number().defined(),
}).strict(true).noUnknown();

export const userSchema: SchemaOf<User> = object({
    username: string().defined(),
    trips: array().of(tripMetaSchema).defined(),
}).strict(true).noUnknown(); */