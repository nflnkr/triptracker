export const trackTypes = [
    "other",
    "walking",
    "running",
    "hiking",
    "cycling",
    "car",
    "bus",
    "tram",
    "train",
    "air",
] as const;

export type TrackType = typeof trackTypes[number];

export interface Track {
    type: TrackType;
    color: string;
    trackpoints: TrackPoint[];
}

export interface TrackPoint {
    ele: number;
    time: number;
    lat: number;
    lon: number;
}

export interface Trip {
    _id: string;
    name: string;
    tracks: Track[];
}

export type TripMeta = Omit<Trip, "tracks">;

export interface User {
    username: string;
    trips: TripMeta[];
    places: PointOfInterest[];
}

export interface PointOfInterest {
    id: string;
    lat: number;
    lon: number;
    name?: string;
    description?: string;
    createdAt: number;
}