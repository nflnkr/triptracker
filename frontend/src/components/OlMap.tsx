import { useEffect, useMemo, useRef, useState } from "react";
import { Feature, Map, View } from "ol";
import styled from "styled-components/macro";
import { PointOfInterest, ProcessedTrack, ProcessedTrackPoint } from "../types/models";
import { Vector as VectorSource, XYZ } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { LineString, Point } from "ol/geom";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Text from "ol/style/Text";
import { FormControl, MenuItem, Paper, Select, SelectChangeEvent } from "@mui/material";
import { Modify } from "ol/interaction";
import { createOlMap, dispatchModifiedTrip, drawTrack, mapStyles, maxZoomLevel } from "../utils/olMap";
import { Extent, extend, createEmpty, getCenter, buffer } from "ol/extent";
import { getCountStyle, placeMarkerStyle } from "../utils/olStyles";
import { ModifyEvent } from "ol/interaction/Modify";
import { useAppDispatch } from "../redux/hooks";

interface MapContainerProps {
    height: string;
    width: string;
}

const MapContainer = styled.div.attrs<MapContainerProps>(props => ({
    style: {
        height: props.height,
        width: props.width
    }
})) <MapContainerProps>`
    position: relative;
    min-width: 200px;
    min-height: 200px;
    overflow: hidden;
    border-radius: 4px;
`;

interface Props {
    tripId?: string;
    tracks?: ProcessedTrack[];
    highlightPoint?: ProcessedTrackPoint | null;
    followPoint?: boolean;
    height?: string;
    width?: string;
    showControls?: boolean;
    isModify?: boolean;
    disableInteraction?: boolean;
    selectedTrackIndex?: number | null;
    shownTracks: number[];
}

const LOGGING = false;

// TODO colored elevation/speed
// TODO add retina support
export default function OlMap({
    tripId,
    tracks,
    highlightPoint,
    followPoint = false,
    height = "400px",
    width = "100%",
    showControls = true,
    isModify = false,
    disableInteraction = false,
    selectedTrackIndex,
    shownTracks
}: Props) {
    const dispatch = useAppDispatch();
    const mapRef = useRef<Map | null>(null);
    const [mapStyle, setMapStyle] = useState<keyof typeof mapStyles>("OSM");
    const mapElementRef = useRef<HTMLDivElement>(null);
    const tracksVectorSourceRef = useRef<VectorSource | null>(null);
    const pointsVectorSourceRef = useRef<VectorSource | null>(null);
    const modifyInteractionRef = useRef<Modify | null>(null);
    const disableInteractionRef = useRef(disableInteraction);
    const isCenteredRef = useRef<boolean>(false);

    useEffect(function initializeMap() {
        if (!mapRef.current) mapRef.current = createOlMap({ center: [0, 0], zoom: 2, disableInteraction: disableInteractionRef.current });
        if (!tracksVectorSourceRef.current) tracksVectorSourceRef.current = new VectorSource({ wrapX: false });
        if (!pointsVectorSourceRef.current) pointsVectorSourceRef.current = new VectorSource({ wrapX: false });
        if (!modifyInteractionRef.current) modifyInteractionRef.current = new Modify({ source: tracksVectorSourceRef.current });

        mapRef.current.setTarget(mapElementRef.current as HTMLElement);

        const tracksVectorLayer = new VectorLayer({
            source: tracksVectorSourceRef.current,
            // declutter: true,
            // style: getCountStyle
        });
        const pointsVectorLayer = new VectorLayer({ source: pointsVectorSourceRef.current });
        mapRef.current.addLayer(tracksVectorLayer);
        mapRef.current.addLayer(pointsVectorLayer);

        return () => {
            mapRef.current?.removeLayer(tracksVectorLayer);
            mapRef.current?.removeLayer(pointsVectorLayer);
            mapRef.current?.setTarget(undefined);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(function drawTracks() {
        if (!mapRef.current || !tracks?.length || !tracksVectorSourceRef.current || !pointsVectorSourceRef.current) return;

        const tracksSource = tracksVectorSourceRef.current;
        const markersSource = pointsVectorSourceRef.current;

        let combinedExtent: Extent = createEmpty();
        tracks.forEach((track, index) => {
            if (!shownTracks.includes(index)) return;

            const feature = drawTrack({
                tracksSource,
                markersSource,
                track,
                trackIndex: index,
                showStartEndMarkers: index === selectedTrackIndex,
                isSelected: index === selectedTrackIndex,
            });
            const geometry = feature.getGeometry();
            if (geometry) extend(combinedExtent, geometry.getExtent());
        });

        if (!isCenteredRef.current && shownTracks.length) {
            mapRef.current.getView().fit(combinedExtent);
            isCenteredRef.current = true;
        }

        return () => {
            tracksSource.clear();
            markersSource.clear();
        };
    }, [tracks, isModify, selectedTrackIndex, shownTracks]);

    useEffect(function toggleModify() {
        if (!mapRef.current || !isModify || !modifyInteractionRef.current) return;

        const modifyInteraction = modifyInteractionRef.current;

        function modifyEventHandler(event: ModifyEvent) {
            if (!tracks || !tracks.length || !tripId) return;

            dispatchModifiedTrip(tripId, tracks, dispatch, event);
        }

        modifyInteraction.on("modifyend", modifyEventHandler);

        mapRef.current.addInteraction(modifyInteraction);

        return () => {
            modifyInteraction.un("modifyend", modifyEventHandler);
            mapRef.current?.removeInteraction(modifyInteraction);
        };
    }, [dispatch, isModify, tracks, tripId]);

    useEffect(function drawFollowPoint() {
        if (!mapRef.current || !pointsVectorSourceRef.current) return;

        const source = pointsVectorSourceRef.current;

        const highlightFeature = source.getFeatureById("highlightPoint") as Feature<Point>;

        if (!highlightFeature) {
            if (!highlightPoint) return;
            const feature = new Feature(new Point([highlightPoint.lon, highlightPoint.lat]));
            feature.setStyle(new Style({
                image: new Circle({
                    radius: 7,
                    fill: new Fill({ color: "#2799e6" }),
                    stroke: new Stroke({
                        color: "white",
                        width: 2,
                    }),
                }),
                zIndex: 10
            }));
            feature.setId("highlightPoint");
            source.addFeature(feature);
        } else {
            if (!highlightPoint) {
                source.removeFeature(highlightFeature);
                return;
            }
            highlightFeature.getGeometry()?.setCoordinates([highlightPoint.lon, highlightPoint.lat]);
        }

        const isInteracting = mapRef.current.getView().getAnimating() || mapRef.current.getView().getInteracting();

        if (followPoint && !isInteracting) {
            mapRef.current?.getView().setCenter([highlightPoint.lon, highlightPoint.lat]);
        }
    }, [highlightPoint, followPoint]);

    useEffect(function setMapStyle() {
        if (!mapRef.current) return;

        (mapRef.current.getAllLayers()[0].getSource() as XYZ).setUrl(`/api/tile/${mapStyles[mapStyle]}/{z}/{x}/{y}`);
        mapRef.current.getView().setMaxZoom(maxZoomLevel[mapStyles[mapStyle]]);
    }, [mapStyle]);

    function handleMapStyleChange(event: SelectChangeEvent) {
        setMapStyle(event.target.value as keyof typeof mapStyles);
    }

    const mapStyleSelect = useMemo(() => {
        return (
            <Paper sx={{ position: "absolute", zIndex: 2, top: 5, left: 5 }}>
                <FormControl size="small">
                    <Select
                        value={mapStyle}
                        onChange={handleMapStyleChange}
                        displayEmpty
                    >
                        {Object.keys(mapStyles).map(style =>
                            <MenuItem key={style} value={style}>{style}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Paper>
        );
    }, [mapStyle]);

    return (
        <MapContainer ref={mapElementRef} height={height} width={width}>
            {showControls &&
                mapStyleSelect
            }
        </MapContainer>
    );
}