import { ChartOptions, ChartEvent, ActiveElement, Chart, TimeScale, Scale } from "chart.js";
import { enUS } from "date-fns/locale";

interface CreateChartOptions {
    type: "distance" | "time";
    onHover?: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => void;
    onResize?: (chart: Chart, size: { width: number; height: number; }) => void;
    onZoomOrPanComplete?: (context: { chart: Chart; }) => void;
}

export function chartjsOptions({ type, onHover, onResize, onZoomOrPanComplete }: CreateChartOptions): ChartOptions<"line"> {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
            },
            decimation: {
                enabled: false,
                algorithm: "lttb",
                samples: 2000,
                // threshold: 2000,
            },
            tooltip: {
                enabled: false,
            },
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                        speed: 0.1,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: "x",
                    drag: {
                        enabled: true,
                        modifierKey: "ctrl",
                        borderColor: "rgb(54, 162, 235)",
                        borderWidth: 1,
                        backgroundColor: "rgba(54, 162, 235, 0.3)",
                    },
                    onZoomComplete: onZoomOrPanComplete
                },
                pan: {
                    enabled: true,
                    mode: "x",
                    onPanComplete: onZoomOrPanComplete
                },
                limits: {
                    x: {
                        min: "original",
                        max: "original",
                    }
                }
            }
        },
        scales: {
            x: type === "distance" ?
                {
                    type: "linear",
                    ticks: {
                        maxRotation: 0,
                        autoSkipPadding: 20
                    },
                    bounds: "data"
                }
                :
                {
                    type: "time",
                    ticks: {
                        maxRotation: 0,
                        autoSkipPadding: 20
                    },
                    bounds: "data",
                    adapters: {
                        date: {
                            locale: enUS
                        }
                    },
                    time: {
                        displayFormats: {
                            hour: "HH",
                            minute: "HH:mm",
                            second: "HH:mm:ss",
                            millisecond: "HH:mm:ss.SS"
                        },
                        minUnit: "second",
                    }
                },
            y: {
                type: "linear",
                display: true,
                position: "left",
            },
            y1: {
                type: "linear",
                display: true,
                position: "right",
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
        elements: {
            point: {
                radius: 0
            },
            line: {
                tension: 0,
                borderJoinStyle: "round",
            }
        },
        interaction: {
            mode: "index",
            intersect: false,
            axis: "x",
        },
        animation: false,
        parsing: false,
        onHover,
        onResize,
    };
}

export const verticalLineOnHoverPlugin = {
    id: "vertical_line_on_hover",
    afterDraw: (chart: Chart & { currentTrackProgress: number; }) => {
        if (!chart.currentTrackProgress) return;

        const ctx = chart.ctx;
        const yAxis = chart.scales.y;
        let x = chart.scales.x.getPixelForValue(chart.currentTrackProgress);

        if (x > chart.chartArea.left - 1 && x < chart.chartArea.left + chart.chartArea.width + 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, yAxis.top);
            ctx.lineTo(x, yAxis.bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.restore();
        }
    }
};