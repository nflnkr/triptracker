import { number } from "yup";
import { ProcessedTrack, ProcessedTrackPoint, ProcessedTrip } from "../types/models";
import { calcAverageSpeed, calcEndDate, calcMaximumSpeed, calcStartDate, calcTotalDistance } from "../utils/trackDataCalcs";

export type TripReducerAction =
    | { type: "set"; payload: { trip: ProcessedTrip | null; }; }
    | { type: "delete"; payload: { indexes: number[]; }; }
    | { type: "merge"; payload: { indexes: number[]; }; }
    | { type: "split"; payload: { index: number; time: number; }; }
    | { type: "rename"; payload: { name: string; }; }
    | { type: "crop"; payload: { index: number; start: number; end: number; }; };

// TODO processTrip() on raw trip after changes instead of calculating here, construct raw trip instead of precessed trip
export default function tripReducer(prevTrip: ProcessedTrip | null, action: TripReducerAction) {
    let newTrip: ProcessedTrip | null = null;
    switch (action.type) {
        case "set": {
            newTrip = action.payload.trip;
            break;
        }
        case "delete": {
            if (prevTrip === null) return null;
            const newTracks = prevTrip.tracks.filter((track, index) => action.payload.indexes.indexOf(index) === -1);
            if (newTracks.length === 0) {
                newTrip = {
                    ...prevTrip,
                    startDate: null,
                    endDate: null,
                    totalDistance: null,
                    maxSpeed: null,
                    tracks: []
                };
                break;
            }
            if (newTracks.length !== prevTrip.tracks.length - action.payload.indexes.length) throw new Error("Error deleting track");
            let startDate = Infinity;
            let endDate = -Infinity;
            let totalDistance = 0;
            let maxSpeed = 0;
            for (let track of newTracks) {
                if (track.startDate < startDate) startDate = track.startDate;
                if (track.endDate > endDate) endDate = track.endDate;
                const curMaxSpeed = calcMaximumSpeed(track.trackpoints);
                if (curMaxSpeed > maxSpeed) maxSpeed = curMaxSpeed;
                totalDistance += calcTotalDistance(track.trackpoints);
            }
            if (!isFinite(startDate) || !isFinite(endDate)) throw new Error("Error calculating dates");
            newTrip = {
                ...prevTrip,
                startDate,
                endDate,
                totalDistance,
                maxSpeed,
                tracks: newTracks
            };
            break;
        }
        case "merge": {
            if (prevTrip === null) return null;

            const tracksToMerge: ProcessedTrack[] = [];
            const newTracks: ProcessedTrack[] = [];
            prevTrip.tracks.forEach((track, index) => {
                if (action.payload.indexes.indexOf(index) === -1) newTracks.push(track);
                else tracksToMerge.push(track);
            });
            if (tracksToMerge.length < 2) throw new Error("There is less than 2 tracks to merge");

            tracksToMerge.sort((a, b) => a.startDate - b.startDate);

            const newTrackpoints: ProcessedTrackPoint[] = [];
            let startDate = Infinity;
            let endDate = -Infinity;
            for (let i = 0; i < tracksToMerge.length; i++) {
                if (tracksToMerge[i].startDate < endDate) throw new Error("Merging overlapping tracks");
                startDate = tracksToMerge[i].startDate;
                endDate = tracksToMerge[i].endDate;
                for (let trackpoint of tracksToMerge[i].trackpoints) {
                    newTrackpoints.push(trackpoint);
                }
            }
            startDate = newTrackpoints[0].time;

            const totalDistance = calcTotalDistance(newTrackpoints);
            const avgSpeed = calcAverageSpeed(newTrackpoints);
            const maxSpeed = calcMaximumSpeed(newTrackpoints);

            const newTrack: ProcessedTrack = {
                trackpoints: newTrackpoints,
                type: tracksToMerge[0].type,
                color: tracksToMerge[0].color,
                startDate,
                endDate,
                totalDistance,
                avgSpeed,
                maxSpeed,
            };

            newTracks.push(newTrack);
            newTracks.sort((a, b) => a.startDate - b.startDate);

            newTrip = {
                ...prevTrip,
                startDate: calcStartDate(newTracks),
                endDate: calcEndDate(newTracks),
                maxSpeed,
                totalDistance,
                tracks: newTracks
            };
            break;
        }
        case "split": {
            if (prevTrip === null) return null;

            const newTracks: ProcessedTrack[] = [];
            let track: ProcessedTrack | null = null;
            for (let i = 0; i < prevTrip.tracks.length; i++) {
                if (i === action.payload.index) track = prevTrip.tracks[i];
                else newTracks.push(prevTrip.tracks[i]);
            }

            if (!track) throw new Error("Couldn't find track");
            if (action.payload.time <= track.startDate || action.payload.time >= track.endDate) return prevTrip;

            const newTrackpoints1: ProcessedTrackPoint[] = [];
            const newTrackpoints2: ProcessedTrackPoint[] = [];
            for (let trackpoint of track.trackpoints) {
                if (trackpoint.time < action.payload.time) newTrackpoints1.push(trackpoint);
                else newTrackpoints2.push(trackpoint);
            }
            if (newTrackpoints1.length === 0 || newTrackpoints2.length === 0) throw new Error("Split time not found on track");

            const newTrack1: ProcessedTrack = {
                trackpoints: newTrackpoints1,
                type: track.type,
                color: track.color,
                startDate: newTrackpoints1[0].time,
                endDate: newTrackpoints1.at(-1)!.time,
                avgSpeed: calcAverageSpeed(newTrackpoints1),
                maxSpeed: calcMaximumSpeed(newTrackpoints1),
                totalDistance: calcTotalDistance(newTrackpoints1)
            };
            const newTrack2: ProcessedTrack = {
                trackpoints: newTrackpoints2,
                type: track.type,
                color: track.color,
                startDate: newTrackpoints2[0].time,
                endDate: newTrackpoints2.at(-1)!.time,
                avgSpeed: calcAverageSpeed(newTrackpoints2),
                maxSpeed: calcMaximumSpeed(newTrackpoints2),
                totalDistance: calcTotalDistance(newTrackpoints2)
            };

            newTrip = {
                ...prevTrip,
                tracks: [...newTracks, newTrack1, newTrack2].sort((a, b) => a.startDate - b.startDate)
            };
            newTrip.startDate = newTrip.tracks[0].startDate;
            newTrip.endDate = newTrip.tracks.at(-1)!.endDate;

            break;
        }
        case "rename": {
            if (prevTrip === null) return null;

            newTrip = { ...prevTrip, name: action.payload.name };
            break;
        }
        case "crop": {
            if (prevTrip === null) return null;

            const newTracks: ProcessedTrack[] = [];
            let track: ProcessedTrack | null = null;
            for (let i = 0; i < prevTrip.tracks.length; i++) {
                if (i === action.payload.index) track = prevTrip.tracks[i];
                else newTracks.push(prevTrip.tracks[i]);
            }

            if (!track) throw new Error("Couldn't find track");
            if (action.payload.start < track.startDate || action.payload.end > track.endDate) return prevTrip;

            const newTrackpoints: ProcessedTrackPoint[] = [];
            for (let trackpoint of track.trackpoints) {
                if (trackpoint.time > action.payload.start && trackpoint.time < action.payload.end) newTrackpoints.push(trackpoint);
            }
            if (newTrackpoints.length === 0) throw new Error("Split time not found on track");

            const newTrack: ProcessedTrack = {
                trackpoints: newTrackpoints,
                type: track.type,
                color: track.color,
                startDate: newTrackpoints[0].time,
                endDate: newTrackpoints.at(-1)!.time,
                avgSpeed: calcAverageSpeed(newTrackpoints),
                maxSpeed: calcMaximumSpeed(newTrackpoints),
                totalDistance: calcTotalDistance(newTrackpoints)
            };

            newTrip = {
                ...prevTrip,
                tracks: [...newTracks, newTrack].sort((a, b) => a.startDate - b.startDate)
            };
            newTrip.startDate = newTrip.tracks[0].startDate;
            newTrip.endDate = newTrip.tracks.at(-1)!.endDate;

            break;
        }
        default:
            throw new Error("Unallowed switch case");
    }
    return newTrip;
};