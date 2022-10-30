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
import { AppDispatch } from "../redux/store";
import { changePlace } from "../redux/placesSlice";
import { setTrackPoints } from "../redux/tripsSlice";

interface MapOptions {
    center?: number[];
    zoom?: number;
    disableInteraction?: boolean;
}

export const maxZoomLevel = {
    "openstreetmap": 19,
    "thunderforest-cycle": 22,
    "thunderforest-landscape": 22,
    "thunderforest-atlas": 22,
    "thunderforest-neighbourhood": 22,
    "thunderforest-outdoors": 22,
} as const;

export const mapStyles = {
    "OSM": "openstreetmap",
    "Opencyclemap": "thunderforest-cycle",
    "Landscape": "thunderforest-landscape",
    "Atlas": "thunderforest-atlas",
    "Neighbourhood": "thunderforest-neighbourhood",
    "Outdoors": "thunderforest-outdoors",
} as const;

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
    isSelected = false,
}: DrawTrackProps) {
    const line = track.trackpoints.map(trackpoint => [trackpoint.lon, trackpoint.lat]);
    let style: StyleLike = isSelected ? getSelectedTrackStyle(track.color) : getNonSelectedTrackStyle(track.color);
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

export function dispatchModifiedTrip(tripId: string, tracks: ProcessedTrack[], dispatch: AppDispatch, event: ModifyEvent) {
    const modifiedTrackFeature = event.features.getArray().find(feature => {
        const id = feature.getId();
        if (!id) return false;
        return /track_\d+/.test(id.toString());
    });
    if (!modifiedTrackFeature) throw new Error("Modified track id not found");
    const trackIndex = Number(modifiedTrackFeature.getId()?.toString().split("_")[1]);
    if (isNaN(trackIndex)) throw new Error("Cannot get feature id");
    const points = (modifiedTrackFeature.getGeometry() as LineString).getCoordinates();
    const newTrackPoints = tracks[trackIndex].trackpoints.map(trackpoint => ({ ...trackpoint }));

    const changeIndex = newTrackPoints.findIndex((trkpt, index) => {
        if (trkpt.lon !== points[index][0] || trkpt.lat !== points[index][1]) return true;
        return false;
    });
    if (changeIndex === -1) throw new Error("Cannot find index of modified point");

    if (newTrackPoints.length === points.length) {
        newTrackPoints[changeIndex].lon = points[changeIndex][0];
        newTrackPoints[changeIndex].lat = points[changeIndex][1];
    } else if (newTrackPoints.length > points.length) {
        newTrackPoints.splice(changeIndex, 1);
    } else {
        const newTrackpoint: ProcessedTrackPoint = {
            lon: points[changeIndex][0],
            lat: points[changeIndex][1],
            time: newTrackPoints[changeIndex - 1].time * 0.5 + newTrackPoints[changeIndex].time * 0.5,
            ele: newTrackPoints[changeIndex - 1].ele * 0.5 + newTrackPoints[changeIndex].ele * 0.5,
            accumulateDistance: newTrackPoints[changeIndex - 1].time * 0.5 + newTrackPoints[changeIndex].accumulateDistance * 0.5,
            speed: 0,
        };
        newTrackPoints.splice(changeIndex, 0, newTrackpoint);
    }
    dispatch(setTrackPoints({ tripId, trackIndex, newTrackPoints }));
}

export function dispatchModifiedPlaces(places: PointOfInterest[], dispatch: AppDispatch, event: ModifyEvent) {
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
    dispatch(changePlace({ id: places[index].id, newPlace }));
}