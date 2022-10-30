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

export interface User {
    _id: string;
    username: string;
    trips: Trip[];
    places: PointOfInterest[];
}

export interface ChartPoint {
    x: number;
    y: number;
}

export interface ProcessedTrip extends Trip {
    startDate: number | null;
    endDate: number | null;
    totalDistance: number | null;
    maxSpeed: number | null;
    tracks: ProcessedTrack[];
}

export interface ProcessedTrack extends Track {
    startDate: number;
    endDate: number;
    totalDistance: number;
    maxSpeed: number;
    avgSpeed: number;
    trackpoints: ProcessedTrackPoint[];
}

export interface ProcessedTrackPoint extends TrackPoint {
    accumulateDistance: number;
    speed: number;
}

export interface PointOfInterest {
    id: string;
    lat: number;
    lon: number;
    name?: string;
    description?: string;
    createdAt: number;
}