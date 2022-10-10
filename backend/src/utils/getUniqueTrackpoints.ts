import { TrackPoint } from "../types/models";

export function getUniqueTrackpoints(trackpoints: TrackPoint[]) {
    const newTrackpoints: TrackPoint[] = [];
    let currentTime = -Infinity;
    for (let trkpt of trackpoints) {
        if (trkpt.time <= currentTime) continue;
        newTrackpoints.push(trkpt);
        currentTime = trkpt.time;
    }
    return newTrackpoints;
}