import { Feature, Map, View } from "ol";
import { useGeographic as geographicCoordinates } from "ol/proj";
import OLTileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";
import { Attribution, ScaleLine } from "ol/control";
import { defaults as interactionDefaults } from "ol/interaction";
import { PointOfInterest, ProcessedTrack, ProcessedTrackPoint } from "../types/models";
import { LineString, Point } from "ol/geom";
import { Vector as VectorSource } from "ol/source";
import { ATTRIBUTION } from "ol/source/OSM";
import { getCountStyle, getEditingTrackStyleFunction, getEndMarkerStyle, getNonSelectedTrackStyle, getSelectedTrackStyle, getStartMarkerStyle } from "./olStyles";
import { StyleLike } from "ol/style/Style";
import { ModifyEvent } from "ol/interaction/Modify";
import { TripReducerAction } from "../reducers/trip";
import { PlacesReducerAction } from "../reducers/places";

interface MapOptions {
    center?: number[];
    zoom?: number;
    disableInteraction?: boolean;
}

export function createOlMap({ center = [0, 0], zoom = 2, disableInteraction = false }: MapOptions): Map {
    geographicCoordinates();

    const tileLayer = new OLTileLayer({
        source: new XYZ({
            url: "/api/tile/openstreetmap/{z}/{x}/{y}",
            attributions: [ATTRIBUTION]
        })
    });

    const interactions = interactionDefaults();

    // replace MouseWheelZoom to disable zoom animation
    // interactions.getArray()[7] = new MouseWheelZoom({
    //     duration: 0
    // });

    if (disableInteraction) interactions.forEach(interaction => {
        interaction.setActive(false);
    });

    const attrib = new Attribution({ collapsible: false });

    const options = {
        view: new View({
            zoom,
            center,
            constrainResolution: true,
            minZoom: 3,
            maxZoom: 22,
        }),
        layers: [tileLayer],
        // controls: [],
        controls: [
            new ScaleLine({
                units: "metric"
            }),
            attrib
        ],
        overlays: [],
        interactions: interactions,
    };

    const mapObject = new Map(options);

    return mapObject;
}

interface DrawTrackProps {
    tracksSource: VectorSource;
    markersSource: VectorSource;
    track: ProcessedTrack;
    trackIndex: number;
    showStartEndMarkers?: boolean;
    showText?: boolean;
    isSelected?: boolean;
}

export function drawTrack({
    tracksSource,
    markersSource,
    track,
    trackIndex,
    showStartEndMarkers = true,
    showText = false,
    isSelected = false
}: DrawTrackProps) {
    const line = track.trackpoints.map(trackpoint => [trackpoint.lon, trackpoint.lat]);
    let style: StyleLike;
    // if (!showStartEndMarkers) {
    // style = getEditingTrackStyleFunction(track.color);
    // } else {
    style = isSelected ? getSelectedTrackStyle(track.color) : getNonSelectedTrackStyle(track.color);
    // }
    const linestring = new LineString(line);

    if (showStartEndMarkers) {
        const startMarker = new Feature(new Point(linestring.getFirstCoordinate()));
        startMarker.setId(`track_${trackIndex}_start`);
        const endMarker = new Feature(new Point(linestring.getLastCoordinate()));
        endMarker.setId(`track_${trackIndex}_end`);
        const startMarkerStyle = getStartMarkerStyle(showText, trackIndex);
        const endMarkerStyle = getEndMarkerStyle(showText, trackIndex);
        startMarker.setStyle(startMarkerStyle);
        endMarker.setStyle(endMarkerStyle);
        markersSource.addFeatures([startMarker, endMarker]);
    }

    const trackFeature = new Feature(linestring);
    trackFeature.setStyle(style);
    trackFeature.setId(`track_${trackIndex}`);

    tracksSource.addFeature(trackFeature);
    return trackFeature;
}

// TODO dispatch trip instead of mutating
export function dispatchModifiedTrip(tracks: ProcessedTrack[], dispatchTrip: React.Dispatch<TripReducerAction>, event: ModifyEvent) {
    const modifiedTrackFeature = event.features.getArray().find(feature => {
        const id = feature.getId();
        if (!id) return false;
        return /track_\d+/.test(id.toString());
    });
    if (!modifiedTrackFeature) throw new Error("Modified track id not found");
    const trackId = Number(modifiedTrackFeature.getId()?.toString().split("_")[1]);
    if (isNaN(trackId)) throw new Error("Cannot get feature id");
    const points = (modifiedTrackFeature.getGeometry() as LineString).getCoordinates();
    const trackpoints = tracks[trackId].trackpoints;

    const changeIndex = trackpoints.findIndex((trkpt, index) => {
        if (trkpt.lon !== points[index][0] || trkpt.lat !== points[index][1]) return true;
        return false;
    });
    if (changeIndex === -1) throw new Error("Cannot find index of modified point");

    // mutating trackpoint object on purpose
    if (trackpoints.length === points.length) {
        trackpoints[changeIndex].lon = points[changeIndex][0];
        trackpoints[changeIndex].lat = points[changeIndex][1];
    } else if (trackpoints.length > points.length) {
        trackpoints.splice(changeIndex, 1);
    } else {
        const newTrackpoint: ProcessedTrackPoint = {
            lon: points[changeIndex][0],
            lat: points[changeIndex][1],
            time: trackpoints[changeIndex - 1].time * 0.5 + trackpoints[changeIndex].time * 0.5,
            ele: trackpoints[changeIndex - 1].ele * 0.5 + trackpoints[changeIndex].ele * 0.5,
            accumulateDistance: trackpoints[changeIndex - 1].time * 0.5 + trackpoints[changeIndex].accumulateDistance * 0.5,
            speed: 0,
        };
        trackpoints.splice(changeIndex, 0, newTrackpoint);
    }
}

export function dispatchModifiedPlaces(places: PointOfInterest[], dispatchPlaces: React.Dispatch<PlacesReducerAction>, event: ModifyEvent) {
    const modifiedPlaceFeature = event.features.getArray().find(feature => {
        const id = feature.getId();
        if (!id) return false;
        return /place_\d+/.test(id.toString());
    });
    const index = Number(modifiedPlaceFeature?.getId()?.toString().split("_")[1]);
    if (isNaN(index) || !modifiedPlaceFeature) throw new Error("Modified feature not found");

    const newCoordinates = (modifiedPlaceFeature.getGeometry() as Point).getCoordinates();
    const newPlace: PointOfInterest = {
        ...places[index],
        lon: newCoordinates[0],
        lat: newCoordinates[1],
    };
    dispatchPlaces({ type: "change", payload: { index, newPlace } });
}