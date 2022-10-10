// @ts-nocheck
import { ProcessedTrackPoint, ProcessedTrip } from "../types/models";
import tripReducer from "./trip";

describe("Trip tracks reducer", () => {
    let initialTrip;
    let tripWithDeletedTrack;
    let tripWithDeletedLastTrack;
    let tripWithDeletedFirstTrack;
    let tripWithDeletedTracks;
    let tripWithSplittedTrack;
    let tripWithMergedTracks;
    let tripWithMerged3Tracks;
    let tripWithCropped1stTrack;

    initialTrip = {
        startDate: 0,
        endDate: 100000,
        name: "trip 1",
        tracks: [
            { // 0
                startDate: 0,
                endDate: 10000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 0,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 3000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 7000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 10000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 1
                startDate: 15000,
                endDate: 25000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 15000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 18000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 22000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 25000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 2, overlaps with 3
                startDate: 50000,
                endDate: 70000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 50000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 55000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 65000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 3, overlaps with 2
                startDate: 60000,
                endDate: 100000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 60000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 80000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 100000,
                    } as ProcessedTrackPoint,
                ]
            },
        ]
    };
    tripWithDeletedTrack = {
        ...initialTrip,
        tracks: initialTrip.tracks.filter((track, index) => index !== 1)
    };
    tripWithDeletedLastTrack = {
        ...initialTrip,
        endDate: 70000,
        tracks: initialTrip.tracks.filter((track, index) => index !== initialTrip.tracks.length - 1)
    };
    tripWithDeletedFirstTrack = {
        ...initialTrip,
        startDate: 15000,
        tracks: initialTrip.tracks.filter((track, index) => index !== 0)
    };
    tripWithDeletedTracks = {
        ...initialTrip,
        tracks: initialTrip.tracks.filter((track, index) => index !== 1 && index !== 2)
    };
    tripWithSplittedTrack = {
        ...initialTrip,
        tracks: [
            { // 0
                startDate: 0,
                endDate: 10000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 0,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 3000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 7000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 10000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 1
                startDate: 15000,
                endDate: 18000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 15000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 18000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 2
                startDate: 22000,
                endDate: 25000,
                trackpoints: [
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 22000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 25000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 3
                startDate: 50000,
                endDate: 70000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 50000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 55000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 65000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 4
                startDate: 60000,
                endDate: 100000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 60000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 80000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 100000,
                    } as ProcessedTrackPoint,
                ]
            },
        ]
    };
    tripWithMergedTracks = {
        ...initialTrip,
        tracks: [
            { // 0
                startDate: 0,
                endDate: 25000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 0,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 3000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 7000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 10000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 15000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 18000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 22000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 25000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 2, overlaps with 3
                startDate: 50000,
                endDate: 70000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 50000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 55000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 65000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 3, overlaps with 2
                startDate: 60000,
                endDate: 100000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 60000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 80000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 100000,
                    } as ProcessedTrackPoint,
                ]
            },
        ]
    };
    tripWithMerged3Tracks = {
        ...initialTrip,
        tracks: [
            { // 0
                startDate: 0,
                endDate: 70000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 0,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 3000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 7000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 10000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 15000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 18000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 22000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 25000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 50000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 55000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 65000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 3, overlaps with 2
                startDate: 60000,
                endDate: 100000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 60000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 80000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 100000,
                    } as ProcessedTrackPoint,
                ]
            },
        ]
    };
    tripWithCropped1stTrack = {
        startDate: 3000,
        endDate: 100000,
        name: "trip 1",
        tracks: [
            { // 0
                startDate: 3000,
                endDate: 7000,
                trackpoints: [
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 3000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 7000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 1
                startDate: 15000,
                endDate: 25000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 15000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 18000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 22000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 25000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 2, overlaps with 3
                startDate: 50000,
                endDate: 70000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 50000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 55000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 65000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                ]
            },
            { // 3, overlaps with 2
                startDate: 60000,
                endDate: 100000,
                trackpoints: [
                    {
                        lat: 0,
                        lon: 0,
                        ele: 10,
                        time: 60000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00001,
                        lon: 0,
                        ele: 10,
                        time: 70000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00002,
                        lon: 0,
                        ele: 10,
                        time: 80000,
                    } as ProcessedTrackPoint,
                    {
                        lat: 0.00003,
                        lon: 0,
                        ele: 10,
                        time: 100000,
                    } as ProcessedTrackPoint,
                ]
            },
        ]
    };

    it("Trip set", () => {
        expect(tripReducer(null, {
            type: "set",
            payload: { trip: initialTrip as ProcessedTrip }
        })).toMatchObject(initialTrip as ProcessedTrip);
    });
    it("Delete present track", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "delete",
            payload: { indexes: [1] }
        })).toMatchObject(tripWithDeletedTrack);
    });
    it("Delete last track", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "delete",
            payload: { indexes: [initialTrip.tracks.length - 1] }
        })).toMatchObject(tripWithDeletedLastTrack);
    });
    it("Delete first track", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "delete",
            payload: { indexes: [0] }
        })).toMatchObject(tripWithDeletedFirstTrack);
    });
    it("Delete nonpresent track", () => {
        expect(() => tripReducer(initialTrip as ProcessedTrip, {
            type: "delete",
            payload: { indexes: [10] }
        })).toThrow();
    });
    it("Delete multiple tracks", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "delete",
            payload: { indexes: [1, 2] }
        })).toMatchObject(tripWithDeletedTracks);
    });
    it("Split track with legit time", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "split",
            payload: { index: 1, time: 20000 }
        })).toMatchObject(tripWithSplittedTrack);
    });
    it("Split track with nonlegit time", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "split",
            payload: { index: 1, time: 5000 }
        })).toMatchObject(initialTrip);
    });
    it("Merge 2 legit tracks", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "merge",
            payload: { indexes: [0, 1] }
        })).toMatchObject(tripWithMergedTracks);
    });
    it("Merge overlapping tracks", () => {
        expect(() => tripReducer(initialTrip as ProcessedTrip, {
            type: "merge",
            payload: { indexes: [2, 3] }
        })).toThrow();
    });
    it("Merge 1 or less tracks", () => {
        expect(() => tripReducer(initialTrip as ProcessedTrip, {
            type: "merge",
            payload: { indexes: [2] }
        })).toThrow();
    });
    it("Merge 3 tracks", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "merge",
            payload: { indexes: [0, 1, 2] }
        })).toMatchObject(tripWithMerged3Tracks);
    });
    it("Crop track", () => {
        expect(tripReducer(initialTrip as ProcessedTrip, {
            type: "crop",
            payload: { index: 0, start: 2999, end: 7001 }
        })).toMatchObject(tripWithCropped1stTrack);
    });
});