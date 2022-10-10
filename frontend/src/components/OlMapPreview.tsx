import { useEffect, useRef } from "react";
import { Map } from "ol";
import styled from "styled-components/macro";
import { ProcessedTrack } from "../types/models";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { drawTrack, createOlMap } from "../utils/olMap";
import { Extent, extend, createEmpty } from "ol/extent";


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
`;

interface Props {
    tracks?: ProcessedTrack[];
    height?: string;
    width?: string;
}

export default function OlMapPreview({
    tracks,
    height = "400px",
    width = "100%",
}: Props) {
    const mapRef = useRef<Map | null>(null);
    const mapElementRef = useRef<HTMLDivElement>(null);
    const tracksVectorSourceRef = useRef<VectorSource | null>(null);
    const pointsVectorSourceRef = useRef<VectorSource | null>(null);

    useEffect(function initializeMap() {
        if (!mapRef.current) mapRef.current = createOlMap({ center: [0, 0], zoom: 2, disableInteraction: true });
        if (!tracksVectorSourceRef.current) tracksVectorSourceRef.current = new VectorSource({ wrapX: false });
        if (!pointsVectorSourceRef.current) pointsVectorSourceRef.current = new VectorSource({ wrapX: false });

        mapRef.current.setTarget(mapElementRef.current as HTMLElement);

        const tracksVectorLayer = new VectorLayer({
            source: tracksVectorSourceRef.current,
            zIndex: 1,
            // style: trackStyleFunction
        });
        const pointsVectorLayer = new VectorLayer({ source: pointsVectorSourceRef.current });

        mapRef.current.addLayer(tracksVectorLayer);

        return () => {
            mapRef.current?.setTarget(undefined);
        };
    }, []);

    useEffect(function drawTracks() {
        if (!mapRef.current || !tracks?.length || !tracksVectorSourceRef.current || !pointsVectorSourceRef.current) return;

        const tracksSource = tracksVectorSourceRef.current;
        const markersSource = pointsVectorSourceRef.current;

        let combinedExtent: Extent = createEmpty();
        tracks.forEach((track, index) => {
            const feature = drawTrack({
                tracksSource,
                markersSource,
                track,
                trackIndex: index,
                showText: false,
            });
            const geometry = feature.getGeometry();
            if (geometry) extend(combinedExtent, geometry.getExtent());
        });

        mapRef.current.getView().fit(combinedExtent);

        return () => {
            tracksSource.clear();
            markersSource.clear();
        };
    }, [tracks]);

    return (
        <MapContainer ref={mapElementRef} height={height} width={width} />
    );
}