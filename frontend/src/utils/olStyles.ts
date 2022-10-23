import { FeatureLike } from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style, { StyleFunction } from "ol/style/Style";
import Text from "ol/style/Text";

// TODO cache objects with same parameters instead of creating new on every function call

const trackLineWidth = 3;

const markerStrokeStyle = new Stroke({
    color: "white",
    width: 2,
});

const placeMarkerImageStyle = new Circle({
    radius: 7,
    fill: new Fill({ color: "#2799e6" }),
    stroke: markerStrokeStyle,
});

const placeMarkerImageStyleSelected = new Circle({
    radius: 7,
    fill: new Fill({ color: "#178515" }),
    stroke: markerStrokeStyle,
});

export const placeMarkerStyle = (text: string, isSelected: boolean) => new Style({
    image: isSelected ? placeMarkerImageStyleSelected : placeMarkerImageStyle,
    text: new Text({
        font: '500 14px "Roboto", sans-serif',
        text: text,
        textAlign: "right",
        offsetX: -10,
        fill: new Fill({
            color: "#000000"
        })
    }),
    zIndex: 15
});

export const getSelectedTrackStyle = (trackColor: string) => [
    new Style({
        stroke: new Stroke({
            color: "#333333",
            width: trackLineWidth + 2,
        }),
        zIndex: 2
    }),
    new Style({
        stroke: new Stroke({
            color: trackColor,
            width: trackLineWidth,
        }),
        zIndex: 3
    })
];

export const getNonSelectedTrackStyle = (trackColor: string) => new Style({
    stroke: new Stroke({
        color: trackColor,
        width: trackLineWidth,
    }),
    zIndex: 1
});

export const getStartMarkerStyle = (showText: boolean, trackIndex: number) => new Style({
    image: new Circle({
        radius: 7,
        fill: new Fill({ color: "#29963d" }),
        stroke: markerStrokeStyle,
    }),
    text: showText ?
        new Text({
            font: '500 14px "Roboto", sans-serif',
            text: `Start ${trackIndex + 1}`,
            textAlign: "right",
            offsetX: -10,
            fill: new Fill({
                color: "#000000"
            })
        })
        :
        undefined,
    zIndex: 15
});

export const getEndMarkerStyle = (showText: boolean, trackIndex: number) => new Style({
    image: new Circle({
        radius: 7,
        fill: new Fill({ color: "#96292a" }),
        stroke: markerStrokeStyle,
    }),
    text: showText ?
        new Text({
            font: '500 14px "Roboto", sans-serif',
            text: `End ${trackIndex + 1}`,
            textAlign: "left",
            offsetX: 10,
            fill: new Fill({
                color: "#000000"
            })
        })
        :
        undefined,
    zIndex: 14
});

export const getCountStyle: StyleFunction = function (feature: FeatureLike) {
    const geometry = feature.getGeometry() as LineString;
    const styles: Style[] = [
        new Style({
            stroke: new Stroke({
                color: "#000000",
                width: 2,
            }),
        }),
    ];

    let pointIndex = 1;
    styles.push(new Style({
        geometry: new Point(geometry.getFirstCoordinate()),
        text: new Text({
            font: "28px sans-serif",
            text: `${pointIndex++}`,
            offsetY: 0,
            fill: new Fill({
                color: "#041b40"
            })
        }),
    }));
    geometry.forEachSegment((start, end) => {
        styles.push(
            new Style({
                geometry: new Point(end),
                text: new Text({
                    font: "28px sans-serif",
                    text: `${pointIndex++}`,
                    offsetY: 0,
                    fill: new Fill({
                        color: "#041b40"
                    })
                }),
            })
        );
    });

    return styles;
};

export const getTrackStyleFunctionBySpeeds = (speeds: number[]): StyleFunction => (feature: FeatureLike) => {
    let max = -Infinity;
    let min = Infinity;
    speeds.forEach(speed => {
        if (speed > max) max = speed;
        if (speed < min) min = speed;
    });
    if (!isFinite(max) || !isFinite(min)) throw new Error("Infinite speed");
    const normalizedSpeeds = speeds.map(speed => Math.min((speed - min) / (max - min), 1));

    const geometry = feature.getGeometry() as LineString;
    const styles: Style[] = [];

    let index = 1;
    geometry.forEachSegment(function (start, end) {
        styles.push(new Style({
            geometry: new LineString([start, end]),
            stroke: new Stroke({
                color: `hsl(${(1 - normalizedSpeeds[index]) * 100}, 100%, 45%)`,
                width: 4,
            })
        }));
        index++;
    });

    return styles;
};

export const getEditingTrackStyleFunction = (trackColor: string): StyleFunction => {
    const image = new Circle({
        radius: 4,
        fill: new Fill({ color: trackColor })
    });
    const stroke = new Style({
        stroke: new Stroke({
            color: trackColor,
            width: trackLineWidth,
        }),
        zIndex: 1
    });
    return (feature: FeatureLike) => {
        const geometry = feature.getGeometry() as LineString;
        const styles: Style[] = [
            stroke,
            new Style({
                geometry: new Point(geometry.getFirstCoordinate()),
                image
            })
        ];

        geometry.forEachSegment(function (start, end) {
            styles.push(new Style({
                geometry: new Point(end),
                image
            }));
        });

        return styles;
    };
}

