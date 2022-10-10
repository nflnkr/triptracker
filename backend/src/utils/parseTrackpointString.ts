import { TrackPoint } from "../types/models";

export function trackpointsToStrings(trackpoints: TrackPoint[]): string[] {
    return trackpoints.map(trackpoint => 
        `${trackpoint.lat.toFixed(6)}/${trackpoint.lon.toFixed(6)}/${trackpoint.ele.toFixed(1)}/${trackpoint.time}`);
}

export function stringsToTrackpoints(trackpointStrings: string[]): TrackPoint[] {
    return trackpointStrings.map(trackpointString => {
        const properties = trackpointString.split("/");
        return {
            lat: Number(properties[0]),
            lon: Number(properties[1]),
            ele: Number(properties[2]),
            time: Number(properties[3]),
        };
    });
}