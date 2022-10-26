import { useEffect, useMemo, useRef, useState } from "react";
import { Feature, Map } from "ol";
import styled from "styled-components/macro";
import { Vector as VectorSource, XYZ } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Point } from "ol/geom";
import { FormControl, MenuItem, Paper, Select, SelectChangeEvent } from "@mui/material";
import { Draw, Modify } from "ol/interaction";
import { createOlMap, dispatchModifiedPlaces, mapStyles, maxZoomLevel } from "../utils/olMap";
import { boundingExtent } from "ol/extent";
import { placeMarkerStyle } from "../utils/olStyles";
import { ModifyEvent } from "ol/interaction/Modify";
import { Coordinate } from "ol/coordinate";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

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
    selectedPlaceIndex?: number | null;
    height?: string;
    width?: string;
    isModify?: boolean;
    isDraw?: boolean;
    showControls?: boolean;
    handleDrawEnd?: (lon: number, lat: number) => void;
}

// TODO add retina support
// TODO animation on selected place change
export default function OlMapPlaces({
    selectedPlaceIndex,
    height = "400px",
    width = "100%",
    isModify = false,
    isDraw = false,
    showControls = true,
    handleDrawEnd,
}: Props) {
    const places = useAppSelector(state => state.places)
    const dispatch = useAppDispatch();

    const mapRef = useRef<Map | null>(null);
    const [mapStyle, setMapStyle] = useState<keyof typeof mapStyles>("OSM");
    const mapElementRef = useRef<HTMLDivElement>(null);
    const pointsVectorSourceRef = useRef<VectorSource | null>(null);
    const modifyInteractionRef = useRef<Modify | null>(null);
    const isCenteredRef = useRef<boolean>(false);

    useEffect(function initializeMap() {
        if (!mapRef.current) mapRef.current = createOlMap({ center: [0, 0], zoom: 2 });
        if (!pointsVectorSourceRef.current) pointsVectorSourceRef.current = new VectorSource({ wrapX: false });
        if (!modifyInteractionRef.current) modifyInteractionRef.current = new Modify({ source: pointsVectorSourceRef.current });

        mapRef.current.setTarget(mapElementRef.current as HTMLElement);
        const pointsVectorLayer = new VectorLayer({ source: pointsVectorSourceRef.current });
        mapRef.current.addLayer(pointsVectorLayer);

        return () => {
            mapRef.current?.removeLayer(pointsVectorLayer);
            mapRef.current?.setTarget(undefined);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(function dispatchOnModify() {
        if (!mapRef.current || !isModify || !modifyInteractionRef.current) return;

        const modifyInteraction = modifyInteractionRef.current;

        function modifyEventHandler(event: ModifyEvent) {
            if (!places || !places.length) return;

            dispatchModifiedPlaces(places, dispatch, event);
        }

        modifyInteraction.on("modifyend", modifyEventHandler);

        mapRef.current.addInteraction(modifyInteraction);

        return () => {
            modifyInteraction.un("modifyend", modifyEventHandler);
            mapRef.current?.removeInteraction(modifyInteraction);
        };
    }, [dispatch, isModify, places]);

    useEffect(function drawInteraction() {
        if (!pointsVectorSourceRef.current || !mapRef.current || !handleDrawEnd || !isDraw) return;

        const source = pointsVectorSourceRef.current;
        const map = mapRef.current;
        const draw = new Draw({
            source,
            type: "Point"
        });
        let feature: Feature<Point>;
        draw.on("drawend", event => {
            feature = event.feature as Feature<Point>;
            // TODO set feature style
            const coords = feature.getGeometry()!.getCoordinates();
            handleDrawEnd(coords[0], coords[1]);
            map.removeInteraction(draw);
        });
        map.addInteraction(draw);
        return () => {
            map.removeInteraction(draw);
            source.removeFeature(feature);
        };
    }, [handleDrawEnd, isDraw]);

    useEffect(function drawPlaces() {
        if (!mapRef.current || !places || selectedPlaceIndex === null || selectedPlaceIndex === undefined || !pointsVectorSourceRef.current) return;

        const markersSource = pointsVectorSourceRef.current;

        const placesCoords: Coordinate[] = [];

        places.forEach((place, index) => {
            const coords = [place.lon, place.lat];
            placesCoords.push(coords);
            const point = new Point(coords);
            const feature = new Feature(point);
            feature.setStyle(placeMarkerStyle(place.name || "", selectedPlaceIndex === index));
            feature.setId(`place_${index}`);
            markersSource.addFeature(feature);
        });

        if (!isCenteredRef.current) {
            const extent = boundingExtent(placesCoords);
            mapRef.current.getView().fit(extent, { maxZoom: 12 });
            isCenteredRef.current = true;
        }

        return () => {
            markersSource.clear();
        };
    }, [places, selectedPlaceIndex]);

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