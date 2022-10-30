import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProcessedTrack, ProcessedTrackPoint, ProcessedTrip, TrackType } from "../types/models";
import { calcAverageSpeed, calcEndDate, calcMaximumSpeed, calcStartDate, calcTotalDistance } from "../utils/trackDataCalcs";

const initialState = [] as ProcessedTrip[];

export const tripsSlice = createSlice({
    name: "trips",
    initialState,
    reducers: {
        setTrips: (state: ProcessedTrip[], action: PayloadAction<ProcessedTrip[]>) => {
            return action.payload.sort((t1, t2) => (t2.startDate || 0) - (t1.startDate || 1));
        },
        setTrip: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string; trip: ProcessedTrip; }>) => {
            const tripIndex = state.findIndex(trip => trip._id === action.payload.tripId);
            state[tripIndex] = action.payload.trip;
        },
        addTrips: (state: ProcessedTrip[], action: PayloadAction<ProcessedTrip[]>) => {
            return [...state, ...action.payload];
        },
        deleteTrips: (state: ProcessedTrip[], action: PayloadAction<string[]>) => {
            return state.filter(trip => !action.payload.includes(trip._id));
        },
        removeTrack: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, trackIndexes: number[]; }>) => {
            const prevTripIndex = state.findIndex(trip => trip._id === action.payload.tripId);
            const prevTrip = state[prevTripIndex];
            if (!prevTrip) throw new Error("Trip not found");

            let newTrip: ProcessedTrip;
            const newTracks = prevTrip.tracks.filter((track, index) => action.payload.trackIndexes.indexOf(index) === -1);

            if (newTracks.length === 0) {
                newTrip = {
                    ...prevTrip,
                    startDate: null,
                    endDate: null,
                    totalDistance: null,
                    maxSpeed: null,
                    tracks: []
                };
            } else {
                if (newTracks.length !== prevTrip.tracks.length - action.payload.trackIndexes.length) throw new Error("Error deleting track");
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
            }
            state[prevTripIndex] = newTrip;
        },
        mergeTracks: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, trackIndexes: number[]; }>) => {
            const prevTripIndex = state.findIndex(trip => trip._id === action.payload.tripId);
            const prevTrip = state[prevTripIndex];
            if (!prevTrip) throw new Error("Trip not found");

            let newTrip: ProcessedTrip;
            const tracksToMerge: ProcessedTrack[] = [];
            const newTracks: ProcessedTrack[] = [];

            prevTrip.tracks.forEach((track, index) => {
                if (action.payload.trackIndexes.indexOf(index) === -1) newTracks.push(track);
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
            state[prevTripIndex] = newTrip;
        },
        splitTrack: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, trackIndex: number; time: number; }>) => {
            const prevTripIndex = state.findIndex(trip => trip._id === action.payload.tripId);
            const prevTrip = state[prevTripIndex];
            if (!prevTrip) throw new Error("Trip not found");

            let newTrip: ProcessedTrip;
            const newTracks: ProcessedTrack[] = [];
            let track: ProcessedTrack | null = null;

            for (let i = 0; i < prevTrip.tracks.length; i++) {
                if (i === action.payload.trackIndex) track = prevTrip.tracks[i];
                else newTracks.push(prevTrip.tracks[i]);
            }

            if (!track) throw new Error("Couldn't find track");
            if (action.payload.time <= track.startDate || action.payload.time >= track.endDate) return state;

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

            state[prevTripIndex] = newTrip;
        },
        renameTrip: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, tripName: string; }>) => {
            const trip = state.find(trip => trip._id === action.payload.tripId);
            if (!trip) throw new Error("Trip not found");

            trip.name = action.payload.tripName;
        },
        cropTrack: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, trackIndex: number; start: number; end: number; }>) => {
            const prevTripIndex = state.findIndex(trip => trip._id === action.payload.tripId);
            const prevTrip = state[prevTripIndex];
            if (!prevTrip) throw new Error("Trip not found");

            let newTrip: ProcessedTrip;
            const newTracks: ProcessedTrack[] = [];
            let track: ProcessedTrack | null = null;

            for (let i = 0; i < prevTrip.tracks.length; i++) {
                if (i === action.payload.trackIndex) track = prevTrip.tracks[i];
                else newTracks.push(prevTrip.tracks[i]);
            }

            if (!track) throw new Error("Couldn't find track");
            if (action.payload.start < track.startDate || action.payload.end > track.endDate) return state;

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

            state[prevTripIndex] = newTrip;
        },
        changeTrackType: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, trackIndex: number, newTrackType: TrackType; }>) => {
            const trip = state.find(trip => trip._id === action.payload.tripId);
            if (!trip) throw new Error("Trip not found");

            trip.tracks[action.payload.trackIndex].type = action.payload.newTrackType;
        },
        setTrackPoints: (state: ProcessedTrip[], action: PayloadAction<{ tripId: string, trackIndex: number, newTrackPoints: ProcessedTrackPoint[]; }>) => {
            const trip = state.find(trip => trip._id === action.payload.tripId);
            if (!trip) throw new Error("Trip not found");

            trip.tracks[action.payload.trackIndex].trackpoints = action.payload.newTrackPoints;
        },
    },
});

export const {
    setTrips,
    setTrip,
    addTrips,
    deleteTrips,
    removeTrack,
    mergeTracks,
    splitTrack,
    renameTrip,
    cropTrack,
    changeTrackType,
    setTrackPoints,
} = tripsSlice.actions;

export const tripsReducer = tripsSlice.reducer;