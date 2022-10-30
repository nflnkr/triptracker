import { ChartPoint, Track, TrackPoint } from "../types/models";
import { ProcessedTrack, ProcessedTrackPoint, ProcessedTrip, Trip } from "../types/models";


export function calcTotalDistance(trackpoints: TrackPoint[]): number {
    let totalDistance = 0;
    for (let i = 1; i < trackpoints.length; i++) {
        totalDistance += distanceBetweenTwoPoints(trackpoints[i - 1].lat, trackpoints[i - 1].lon, trackpoints[i].lat, trackpoints[i].lon);
    }
    return totalDistance;
}

export function calcMaximumSpeed(trackpoints: TrackPoint[]): number {
    let maxSpeed = 0;
    for (let i = 1; i < trackpoints.length; i++) {
        const distance = distanceBetweenTwoPoints(trackpoints[i - 1].lat, trackpoints[i - 1].lon, trackpoints[i].lat, trackpoints[i].lon);
        const dt = (trackpoints[i].time - trackpoints[i - 1].time) / 1000;
        const speed = distance / dt;
        if (isFinite(speed) && speed > maxSpeed) maxSpeed = speed;
    }
    return maxSpeed;
}

export function calcAverageSpeed(trackpoints: TrackPoint[]): number {
    return calcTotalDistance(trackpoints) / ((trackpoints.at(-1)!.time - trackpoints[0].time) / 1000);
}

// https://www.movable-type.co.uk/scripts/latlong.html
export function distanceBetweenTwoPoints(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
    if (!lat1 || !lat2 || !lon1 || !lon2) return 0;
    var p = 0.017453292519943295; // Math.PI / 180
    var cos = Math.cos;
    var a = 0.5 - cos((lat2 - lat1) * p) / 2 + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742e3 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371e3 m
}

export function movingAverage(points: ChartPoint[], spanSize: number): ChartPoint[] {
    const result: ChartPoint[] = [];
    for (let i = 0; i < points.length; i++) {
        let sum = 0;
        for (let j = -spanSize; j <= spanSize; j++) {
            let index = i + j;
            if (index < 0) index = 0;
            if (index > points.length - 1) index = points.length - 1;
            sum += points[index].y;
        }
        result.push({
            x: points[i].x,
            y: +(sum / (spanSize * 2 + 1)).toFixed(1)
        });
    }
    return result;
}

// TODO geodata filtering
// TODO refactor
export function processTrip(trip: Trip) {
    const processedTrip = trip as ProcessedTrip;
    processedTrip.startDate = Infinity;
    processedTrip.endDate = -Infinity;
    processedTrip.totalDistance = 0;
    processedTrip.maxSpeed = 0;

    trip.tracks.forEach(track => {
        const processedTrack = track as ProcessedTrack;
        const trackpoints = processedTrack.trackpoints;

        const trackStartDate = trackpoints[0].time;
        if (trackStartDate < processedTrip.startDate!) processedTrip.startDate = trackStartDate;

        const trackEndDate = trackpoints.at(-1)!.time;
        if (trackEndDate > processedTrip.endDate!) processedTrip.endDate = trackEndDate;

        const trackMaxSpeed = calcMaximumSpeed(trackpoints);
        if (trackMaxSpeed > processedTrip.maxSpeed!) processedTrip.maxSpeed = trackMaxSpeed;

        processedTrack.startDate = trackStartDate;
        processedTrack.endDate = trackEndDate;
        processedTrack.maxSpeed = trackMaxSpeed;
        processedTrack.avgSpeed = calcAverageSpeed(trackpoints);

        let trackTotalDistance = 0;
        // TODO moving average speed
        const movingAverageWindowWidth = 7;
        const movingAverageSlidingWindow: number[] = [];

        for (let i = 0; i < trackpoints.length; i++) {
            const processedTrackPoint = trackpoints[i] as ProcessedTrackPoint;
            const distanceFromLastPoint = distanceBetweenTwoPoints(trackpoints[i - 1]?.lat, trackpoints[i - 1]?.lon, trackpoints[i].lat, trackpoints[i].lon);
            trackTotalDistance += distanceFromLastPoint;
            processedTrackPoint.accumulateDistance = trackTotalDistance;

            // raw speed
            const deltaTimeFromLastPointInMs = trackpoints[i].time - trackpoints[i - 1]?.time;
            const speed = isNaN(deltaTimeFromLastPointInMs) ?
                0
                :
                distanceFromLastPoint / (deltaTimeFromLastPointInMs / 1000);
            processedTrackPoint.speed = speed;
        }

        processedTrack.totalDistance = trackTotalDistance;
        processedTrip.totalDistance! += trackTotalDistance;
    });

    processedTrip.tracks.sort((a, b) => a.startDate - b.startDate);

    return processedTrip;
}

export function getChartData(track: ProcessedTrack, yAxis: "speed" | "elevation", xAxis: "time" | "distance"): ChartPoint[] {
    const chartPoints: ChartPoint[] = [];
    const trackpoints = track.trackpoints;
    const chartType = `${yAxis}/${xAxis}`;
    let currentAccumDistance = -1;
    switch (chartType) {
        case "speed/time":
            trackpoints.forEach((trackpoint, index) => {
                chartPoints.push({
                    x: trackpoint.time,
                    y: +(trackpoint.speed * 3.6).toFixed(1)
                });
            });
            break;
        case "speed/distance":
            for (let i = 0, j = 0; i < trackpoints.length; i++) {
                if (trackpoints[i].accumulateDistance > currentAccumDistance) {
                    currentAccumDistance = trackpoints[i].accumulateDistance;
                    chartPoints.push({
                        x: Math.floor(currentAccumDistance),
                        y: +(trackpoints[i].speed * 3.6).toFixed(1)
                    });
                }
            }
            break;
        case "elevation/time":
            trackpoints.forEach((trackpoint, index) => {
                chartPoints.push({
                    x: trackpoint.time,
                    y: +trackpoint.ele.toFixed(1)
                });
            });
            break;
        case "elevation/distance":
            for (let i = 0, j = 0; i < trackpoints.length; i++) {
                if (trackpoints[i].accumulateDistance > currentAccumDistance) {
                    currentAccumDistance = trackpoints[i].accumulateDistance;
                    chartPoints.push({
                        x: Math.floor(currentAccumDistance),
                        y: +trackpoints[i].ele.toFixed(1)
                    });
                }
            }
            break;
        default:
            throw new Error("Unknown axis parameter");
    }

    return chartPoints;
}

export function calcStartDate(tracks: ProcessedTrack[]) {
    let time = Infinity;
    for (let track of tracks) {
        if (track.startDate < time) time = track.startDate;
    }
    if (!isFinite(time)) throw new Error("Error calculating start date");
    return time;
}

export function calcEndDate(tracks: ProcessedTrack[]) {
    let time = -Infinity;
    for (let track of tracks) {
        if (track.endDate > time) time = track.endDate;
    }
    if (!isFinite(time)) throw new Error("Error calculating end date");
    return time;
}

export function approximateIntermediatePoint(trkpt1: ProcessedTrackPoint, trkpt2: ProcessedTrackPoint, progress: number): ProcessedTrackPoint {
    const distanceFromLastPoint = distanceBetweenTwoPoints(trkpt1.lat, trkpt1.lon, trkpt2.lat, trkpt2.lon);
    const deltaTimeFromLastPointInMs = trkpt2.time - trkpt1.time;
    const speed = isNaN(deltaTimeFromLastPointInMs) ?
        0
        :
        distanceFromLastPoint / (deltaTimeFromLastPointInMs / 1000);
    return {
        lat: trkpt1.lat * (1 - progress) + trkpt2.lat * progress,
        lon: trkpt1.lon * (1 - progress) + trkpt2.lon * progress,
        time: trkpt1.time * (1 - progress) + trkpt2.time * progress,
        ele: trkpt1.ele * (1 - progress) + trkpt2.ele * progress,
        speed
    } as ProcessedTrackPoint;
}

export function toRawTrip(trip: ProcessedTrip): Trip {
    const rawTracks: Track[] = [];
    trip.tracks.forEach(track => {
        const rawTrackpoints: TrackPoint[] = [];
        track.trackpoints.forEach(trackpoint => {
            rawTrackpoints.push({
                lat: trackpoint.lat,
                lon: trackpoint.lon,
                ele: trackpoint.ele,
                time: trackpoint.time
            });
        });
        rawTracks.push({
            type: track.type,
            color: track.color,
            trackpoints: rawTrackpoints
        });
    });
    const rawTrip: Trip = {
        _id: trip._id,
        name: trip.name,
        tracks: rawTracks
    };
    return rawTrip;
}