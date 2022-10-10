import {
    Alert,
    Box,
    Button,
    Checkbox,
    Container,
    Divider,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Slider,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { useCallback, useContext, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../contexts/user";
import type { ProcessedTrackPoint } from "../types/models";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import SpeedIcon from "@mui/icons-material/Speed";
import StraightenIcon from "@mui/icons-material/Straighten";
import type { ChartData } from "chart.js";
import {
    Chart as ChartJS,
    Tooltip as ChartTooltip,
    CategoryScale,
    Decimation,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Title
} from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import OlMap from "../components/OlMap";
import tripReducer from "../reducers/trip";
import { chartjsOptions, verticalLineOnHoverPlugin } from "../utils/chartjs";
import { approximateIntermediatePoint, getChartData, getIndexesOfTrue, toRawTrip, movingAverage, processTrip } from "../utils/trackDataCalcs";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import FastForwardIcon from "@mui/icons-material/FastForward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TracklistItem from "../components/TracklistItem";
import PageLoading from "../components/PageLoading";

ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend,
    Decimation,
    zoomPlugin,
    verticalLineOnHoverPlugin,
);

type TripSaveState = "sending" | "success" | "error" | null;

const MAP_HEIGHT = 480;
const CHART_HEIGHT = 200;
const PLAYBACK_MAX_FPS = 30;
const PLAYBACK_MIN_FRAMETIME = 1000 / PLAYBACK_MAX_FPS;

const playbackSpeeds = [-2000, -1000, -500, -250, -125, -50, -25, -10, -5, -2, -1, 1, 2, 5, 10, 25, 50, 125, 250, 500, 1000, 2000] as const;
type PlaybackSpeed = typeof playbackSpeeds[number];

interface PlaybackState {
    playing: boolean;
    speed: PlaybackSpeed;
}
const initialPlaybackState: PlaybackState = { playing: false, speed: 1 };

// TODO display 404/redirect for not existing trips
// TODO ability to create and draw track
// TODO hover on map near tracks highlights track on list
// TODO points
// TODO flex direction column on mobile
// TODO stop points as circles, text in which indicates stop time
export default function TripPage() {
    const { setUser } = useContext(UserContext);
    const [trip, dispatchTrip] = useReducer(tripReducer, null);
    const [chartData, setChartData] = useState<ChartData<"line"> | null>(null);
    const [highlightPoint, setHighlightPoint] = useState<ProcessedTrackPoint | null>(null);
    const [followOnChartHover, setFollowOnChartHover] = useState<boolean>(false);
    const [chartType, setChartType] = useState<"time" | "distance">("time");
    const [shownTracks, setShownTracks] = useState<boolean[]>([]);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
    const [currentTrackProgress, setCurrentTrackProgress] = useState<number | null>(null);
    const [playbackState, setPlaybackState] = useState<PlaybackState>(initialPlaybackState);
    const [tripName, setTripName] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [tripSaveState, setTripSaveState] = useState<TripSaveState>(null);
    const [progressZoomTimeBoundaries, setProgressZoomTimeBoundaries] = useState<[number, number] | null>(null);
    const [chartAreaDims, setChartAreaDims] = useState<{ width: string, left: string; } | null>(null);
    const playbackAnimationReady = useRef<boolean>(true);
    const playbackAnimationTimeRef = useRef<number | null>(null);
    const navigate = useNavigate();
    const chartRef = useRef<ChartJSOrUndefined<"line"> & { currentTrackProgress: number; }>(null);
    const tripId = useParams().tripId;
    const defferedTrackProgress = useDeferredValue(currentTrackProgress);
    const selectedTrack = selectedTrackIndex === null || !trip ? null : trip.tracks[selectedTrackIndex];

    if (chartRef.current && currentTrackProgress !== null) chartRef.current.currentTrackProgress = currentTrackProgress;

    const fetchTrip = useCallback(async function fetchTrip(abortController?: AbortController) {
        if (!tripId) return;
        try {
            const response = await fetch("/api/trip/" + tripId, { credentials: "include", signal: abortController?.signal });
            const result = await response.json();
            const trip = processTrip(result.trip);

            dispatchTrip({ type: "set", payload: { trip } });
            setShownTracks(Array(trip.tracks.length).fill(true));
            setSelectedTrackIndex(0);
            setCurrentTrackProgress(trip.tracks[0].startDate);
            setTripName(trip.name);
        } catch (error) {
            console.log("Error setting trip", error);
        }
    }, [tripId]);

    useEffect(function getTrip() {
        if (!fetchTrip) return;

        const controller = new AbortController();
        fetchTrip(controller);

        return () => controller.abort();
    }, [fetchTrip]);

    useEffect(function refreshChartData() {
        if (!trip || !selectedTrack || !trip.tracks.length) return setChartData(null);

        const data: ChartData<"line"> = {
            datasets: [
                {
                    label: "Speed, km/h",
                    data: movingAverage(getChartData(selectedTrack, "speed", chartType), 4),
                    borderColor: "rgb(255, 99, 132)",
                    backgroundColor: "rgba(255, 99, 132, 0.5)",
                    yAxisID: "y",
                },
                {
                    label: "Elevation, m",
                    data: movingAverage(getChartData(selectedTrack, "elevation", chartType), 2),
                    borderColor: "rgb(53, 162, 235)",
                    backgroundColor: "rgba(53, 162, 235, 0.5)",
                    yAxisID: "y1",
                },
            ],
        };

        setChartData(data);
        chartRef.current?.resetZoom();
    }, [chartType, selectedTrack, trip]);

    useEffect(function resetTrackProgress() {
        if (!trip || !selectedTrack || !trip.tracks.length) return;

        setCurrentTrackProgress(selectedTrack.startDate);
        setProgressZoomTimeBoundaries([selectedTrack.startDate, selectedTrack.endDate]);
    }, [selectedTrack, trip]);

    useEffect(function refreshShownTracks() {
        if (!trip) return;

        setShownTracks(prevShownTracks => {
            const newShownTracks: boolean[] = [];
            for (let i = 0; i < trip.tracks.length; i++) {
                newShownTracks[i] = prevShownTracks[i] !== undefined ? prevShownTracks[i] : true;
            }
            return newShownTracks;
        });
        if (!trip.tracks.length) {
            setSelectedTrackIndex(null);
            setCurrentTrackProgress(null);
        }
    }, [trip]);

    useEffect(function handlePlaybackAnimation() {
        if (!trip || !selectedTrack) return;

        if (playbackState.playing) {
            if (!playbackAnimationReady.current) return;

            playbackAnimationReady.current = false;
            const timestamp = Date.now();
            if (playbackAnimationTimeRef.current === null) playbackAnimationTimeRef.current = timestamp;
            let dt = timestamp - playbackAnimationTimeRef.current;
            playbackAnimationTimeRef.current = timestamp;

            setTimeout(() => {
                playbackAnimationReady.current = true;
                setCurrentTrackProgress(prev => {
                    return prev ? prev + dt * playbackState.speed + 1 : prev;
                });
            }, PLAYBACK_MIN_FRAMETIME);
        } else {
            playbackAnimationTimeRef.current = null;
            playbackAnimationReady.current = true;
        }
    }, [playbackState, selectedTrack, trip, defferedTrackProgress]);

    useEffect(function approximateHighlightPoint() {
        if (defferedTrackProgress === null) return;
        if (!selectedTrack) return setHighlightPoint(null);

        if (defferedTrackProgress > selectedTrack.endDate) {
            setPlaybackState(prev => ({ ...prev, playing: false }));
            setCurrentTrackProgress(selectedTrack.startDate);
        } else {
            const trkptIndex = selectedTrack.trackpoints.findIndex(trackpoint => trackpoint.time >= defferedTrackProgress);
            const trkpt2 = selectedTrack.trackpoints[trkptIndex];
            if (trkptIndex < 1) return setHighlightPoint(trkpt2);
            const trkpt1 = selectedTrack.trackpoints[trkptIndex - 1];
            const progress = (defferedTrackProgress - trkpt1.time) / (trkpt2.time - trkpt1.time);
            const trkpt = approximateIntermediatePoint(trkpt1, trkpt2, progress);
            setHighlightPoint(trkpt);
        }
    }, [defferedTrackProgress, selectedTrack]);

    useEffect(function changeTripName() {
        if (!tripName) return;

        dispatchTrip({ type: "rename", payload: { name: tripName } });
    }, [tripName]);

    useEffect(function drawVerticalLineOnChart() {
        if (!chartRef.current || defferedTrackProgress === null) return;

        chartRef.current.update();
    }, [defferedTrackProgress, progressZoomTimeBoundaries]);

    useEffect(function refreshChartAreaDims() {
        setTimeout(() => {
            if (!chartRef.current?.chartArea) return setChartAreaDims({ width: "auto", left: "0" });

            setChartAreaDims({ width: `${chartRef.current.chartArea.width}px`, left: `${chartRef.current.chartArea.left}px` });
        }, 100);
    }, [chartData, isEditing, progressZoomTimeBoundaries]);

    useEffect(function reactToTrackProgressOutOfBounds() {
        if (!progressZoomTimeBoundaries || !defferedTrackProgress) return;
        // TODO change
        /* if (progressZoomTimeBoundaries[0] > defferedTrackProgress) setProgressZoomTimeBoundaries([
            defferedTrackProgress,
            defferedTrackProgress + progressZoomTimeBoundaries[1] - progressZoomTimeBoundaries[0]
        ]);
        if (progressZoomTimeBoundaries[1] < defferedTrackProgress) setProgressZoomTimeBoundaries([
            defferedTrackProgress,
            defferedTrackProgress + progressZoomTimeBoundaries[1] - progressZoomTimeBoundaries[0]
        ]); */
    }, [defferedTrackProgress, progressZoomTimeBoundaries]);

    useEffect(function zoomScaleChart() {
        if (!chartRef || !progressZoomTimeBoundaries) return;

        chartRef.current?.zoomScale("x", { min: progressZoomTimeBoundaries[0], max: progressZoomTimeBoundaries[1] });
    }, [progressZoomTimeBoundaries]);

    useEffect(function stopPlaybackWhenEditing() {
        if (isEditing) setPlaybackState(prev => ({ ...prev, playing: false }));
    }, [isEditing]);

    const handleToggle = (index: number) => () => {
        setShownTracks(prev => {
            const newShownTracks = prev.slice();
            newShownTracks[index] = !prev[index];
            return newShownTracks;
        });
    };

    function chartResetZoom() {
        if (!chartRef.current) return;
        chartRef.current.resetZoom();
    }

    function handleChartTypeChange(e: unknown, newChartType: "time" | "distance") {
        if (newChartType) setChartType(newChartType);
    }

    function handleTrackProgressChange(e: unknown, newValue: number | number[]) {
        if (!trip || !selectedTrack) return;
        requestAnimationFrame(() => {
            setCurrentTrackProgress(newValue as number);
        });
    }

    function handlePlaybackButton() {
        setPlaybackState(prev => ({ ...prev, playing: !prev.playing }));
    }

    function handlePlaybackSpeedDecrease() {
        setPlaybackState(prev => {
            let currentSpeedIndex = playbackSpeeds.indexOf(prev.speed) - 1;
            if (currentSpeedIndex < 0) currentSpeedIndex = 0;
            return { ...prev, speed: playbackSpeeds[currentSpeedIndex] };
        });
    }

    function handlePlaybackSpeedIncrease() {
        setPlaybackState(prev => {
            let currentSpeedIndex = playbackSpeeds.indexOf(prev.speed) + 1;
            if (currentSpeedIndex > playbackSpeeds.length - 1) currentSpeedIndex = playbackSpeeds.length - 1;
            return { ...prev, speed: playbackSpeeds[currentSpeedIndex] };
        });
    }

    const chartOptions = useMemo(() => chartjsOptions({
        type: chartType,
        onResize: (chart) => {
            if (!chart.chartArea) return setChartAreaDims(null);

            setChartAreaDims({ width: `${chart.chartArea.width}px`, left: `${chart.chartArea.left}px` });
        },
        onZoomOrPanComplete: (context) => {
            const min = context.chart.scales["x"].min;
            const max = context.chart.scales["x"].max;

            if ((context.chart as any).currentTrackProgress < min) setCurrentTrackProgress(min);
            if ((context.chart as any).currentTrackProgress > max) setCurrentTrackProgress(min);
            setProgressZoomTimeBoundaries([min, max]);
        }
    }), [chartType]);

    const shownTracksObjects = useMemo(() => trip?.tracks.filter((track, index) => shownTracks![index]), [shownTracks, trip?.tracks]);

    const trackEditButtons = useMemo(() => {
        if (!isEditing) return;

        function handleSplitTrack() {
            if (!highlightPoint || selectedTrackIndex === null) return;
            dispatchTrip({
                type: "split",
                payload: { index: selectedTrackIndex, time: highlightPoint.time }
            });
        }

        function handleMergeSelectedTracks() {
            dispatchTrip({
                type: "merge",
                payload: { indexes: getIndexesOfTrue(shownTracks) }
            });
            setSelectedTrackIndex(getIndexesOfTrue(shownTracks)[0]);
        }

        function handleDeleteSelectedTracks() {
            dispatchTrip({
                type: "delete",
                payload: { indexes: getIndexesOfTrue(shownTracks) }
            });
        }

        function handleCropSelectedTrack() {
            if (!progressZoomTimeBoundaries || selectedTrackIndex === null) return;
            dispatchTrip({
                type: "crop",
                payload: { index: selectedTrackIndex, start: progressZoomTimeBoundaries[0], end: progressZoomTimeBoundaries[1] }
            });
        }

        function handleDrawTrack() {
            // Enable draw mode, when "done" button clicked get coordinates and create new track and add to trip
        }

        return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, p: 1 }}>
                <Button onClick={handleSplitTrack} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Split</Button>
                <Button onClick={handleMergeSelectedTracks} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Merge</Button>
                <Button onClick={handleDeleteSelectedTracks} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Delete</Button>
                <Button onClick={handleCropSelectedTrack} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Crop</Button>
                <Button disabled onClick={handleDrawTrack} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Draw</Button>
            </Box>
        );
    }, [highlightPoint, isEditing, progressZoomTimeBoundaries, selectedTrackIndex, shownTracks]);

    const tripMetadata = useMemo(() => {
        if (!trip) return;

        return (
            <List dense={false} sx={{ display: "flex", flexWrap: "wrap" }} >
                {[
                    ["Start date", trip.startDate !== null ? new Date(trip.startDate).toLocaleDateString() : "No data", <CalendarMonthIcon />],
                    ["Start time", trip.startDate !== null ? new Date(trip.startDate).toLocaleTimeString() : "No data", <AccessTimeIcon />],
                    ["Distance", trip.totalDistance !== null ? (trip.totalDistance / 1000).toFixed(3) + " km" : "No data", <StraightenIcon />],
                    ["Max speed", trip.maxSpeed !== null ? trip.maxSpeed.toFixed(1) + " km/h" : "No data", <SpeedIcon />],
                ].map(tripData => (
                    <ListItem key={tripData[0] as string} sx={{ flex: "1 1 0" }}>
                        <ListItemAvatar sx={{ minWidth: 40 }} >
                            {tripData[2]}
                        </ListItemAvatar>
                        <ListItemText sx={{ my: 0 }} primary={tripData[0]} secondary={tripData[1]} />
                    </ListItem>
                ))}
            </List>
        );
    }, [trip]);

    const tripControls = useMemo(() => {
        if (!trip) return;

        async function handleTripDeleteClick() {
            // TODO handle errors
            try {
                const response = await fetch("/api/trip/" + tripId, {
                    method: "delete",
                    credentials: "include"
                });
                const result = await response.json();
                if (result.success) {
                    setUser(prevUser => ({
                        username: prevUser!.username,
                        trips: prevUser!.trips.filter(trip => trip._id !== tripId),
                        places: prevUser!.places
                    }));
                    navigate("/trips");
                } else {
                    // TODO
                    console.log("Trip delete failed", result);
                }
            } catch (error) {
                console.log("Trip delete failed", error);
            }
        }

        function handleEditClick() {
            setIsEditing(true);
            setTripSaveState(null);
        }

        function handleCancelClick() {
            dispatchTrip({ type: "set", payload: { trip: null } });
            fetchTrip();
            setIsEditing(false);
        }

        async function handleSaveClick() {
            if (!trip) return;
            // TODO handle errors
            setTripSaveState("sending");
            try {
                const rawTrip = toRawTrip(trip);
                const response = await fetch("/api/trip/" + tripId, {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ trip: rawTrip })
                });
                const result = await response.json();
                console.log("trip upload result:", result);
                if (result.success) {
                    // TODO
                    setTripSaveState("success");
                    setIsEditing(false);
                } else {
                    // TODO
                    console.log("Trip save failed", result);
                    setTripSaveState("error");
                }
            } catch (error) {
                console.log("trip update error:", error);
                setTripSaveState("error");
            }
        }

        function handleTripNameChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
            // TODO validate name
            setTripName(event.target.value);
        }

        return (
            <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                    {isEditing ?
                        <TextField
                            value={tripName}
                            onChange={handleTripNameChange}
                            variant="standard"
                            InputProps={{
                                sx: {
                                    fontSize: "2.125rem",
                                    height: "1.235em"
                                }
                            }}
                        />
                        :
                        <Typography variant="h4">{tripName}</Typography>
                    }
                </Box>
                {tripSaveState === "success" &&
                    <Alert severity={tripSaveState}>Trip saved successfully!</Alert>
                }
                {tripSaveState === "error" &&
                    <Alert severity={tripSaveState}>Couldn"t save trip!</Alert>
                }
                {isEditing ?
                    <>
                        <LoadingButton
                            color="primary"
                            onClick={handleSaveClick}
                            loading={tripSaveState === "sending"}
                            loadingPosition="start"
                            startIcon={<SaveIcon />}
                            variant="contained"
                        >
                            Save
                        </LoadingButton>
                        <Button variant="contained" color="error" onClick={handleTripDeleteClick}>Delete</Button>
                        <Button variant="contained" onClick={handleCancelClick}>Cancel</Button>
                    </>
                    :
                    <Button variant="contained" onClick={handleEditClick}>Edit</Button>
                }
            </Box>
        );
    }, [fetchTrip, isEditing, navigate, setUser, trip, tripId, tripName, tripSaveState]);

    const trackControls = useMemo(() => {
        if (!selectedTrack) return;

        return (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <IconButton onClick={handlePlaybackSpeedDecrease}>
                    <FastRewindIcon color={playbackState.speed < 0 ? "success" : undefined} />
                </IconButton>
                <IconButton sx={{ minWidth: "4em" }} color="primary" onClick={handlePlaybackButton}>
                    {playbackState.playing ?
                        <PauseCircleIcon fontSize="large" />
                        :
                        <PlayCircleIcon fontSize="large" />
                    }
                    <Typography>
                        {`x${Math.abs(playbackState.speed)}`}
                    </Typography>
                </IconButton>
                <IconButton onClick={handlePlaybackSpeedIncrease}>
                    <FastForwardIcon color={playbackState.speed > 0 ? "success" : undefined} />
                </IconButton>
                <FormControlLabel
                    control={<Checkbox
                        checked={followOnChartHover}
                        onChange={e => setFollowOnChartHover(e.target.checked)}
                        color="info"
                    />}
                    label="Follow highlighted point"
                />
                <ToggleButtonGroup
                    exclusive
                    value={chartType}
                    onChange={handleChartTypeChange}
                    size="small"
                >
                    <ToggleButton value={"time"}>Time</ToggleButton>
                    <ToggleButton value={"distance"}>Distance</ToggleButton>
                </ToggleButtonGroup>
            </Box>
        );
    }, [chartType, followOnChartHover, playbackState.playing, playbackState.speed, selectedTrack]);

    const tracklist = useMemo(() => {
        if (!trip) return;
        return (
            <List dense={false} sx={{ overflowY: "auto", flexGrow: 1 }} >
                {trip.tracks.map((track, index) => (
                    <ListItem key={track.startDate} sx={{ width: "auto", alignItems: "start" }} >
                        {isEditing &&
                            <Checkbox
                                edge="start"
                                checked={shownTracks[index] === undefined ? true : shownTracks[index]}
                                onClick={handleToggle(index)}
                                tabIndex={-1}
                                disableRipple
                            />
                        }
                        <TracklistItem
                            editing={isEditing}
                            track={track}
                            selected={index === selectedTrackIndex}
                            onClick={() => setSelectedTrackIndex(index)}
                            shown={shownTracks[index] === undefined ? true : shownTracks[index]}
                        />
                    </ListItem>
                ))}
            </List>);
    }, [isEditing, selectedTrackIndex, shownTracks, trip]);

    if (!trip) return <PageLoading />;

    return (
        <Container maxWidth={"xl"}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {tripControls}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: "21em", flexGrow: 1, width: "21em" }}>
                        <Paper elevation={3} >
                            <OlMap
                                height={`${MAP_HEIGHT}px`}
                                tracks={shownTracksObjects}
                                highlightPoint={highlightPoint}
                                followPoint={followOnChartHover}
                                isModify={isEditing}
                                dispatchTrip={dispatchTrip}
                                selectedTrackIndex={selectedTrackIndex}
                            />
                        </Paper>
                        <Box>
                            {selectedTrack && currentTrackProgress !== null && trip.tracks.length && progressZoomTimeBoundaries &&
                                <>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <IconButton onClick={chartResetZoom}>
                                            <RestartAltIcon />
                                        </IconButton>
                                        <Slider
                                            value={progressZoomTimeBoundaries}
                                            step={10}
                                            min={selectedTrack.startDate}
                                            max={selectedTrack.endDate}
                                            sx={{
                                                "& .MuiSlider-thumb, & .MuiSlider-track": {
                                                    transition: "none",
                                                },
                                                "& .MuiSlider-thumb": {
                                                    borderRadius: "4px",
                                                    width: "6px"
                                                }
                                            }}
                                            onChange={e => setProgressZoomTimeBoundaries((e as any).target.value)}
                                        />
                                    </Box>
                                    <Box sx={{ width: chartAreaDims?.width || "100%" }}>
                                        <Slider
                                            value={currentTrackProgress as number}
                                            step={10}
                                            min={progressZoomTimeBoundaries[0]}
                                            max={progressZoomTimeBoundaries[1]}
                                            onChange={handleTrackProgressChange}
                                            sx={{
                                                "& .MuiSlider-thumb, & .MuiSlider-track": {
                                                    transition: "none",
                                                },
                                                zIndex: 1,
                                                ml: chartAreaDims?.left || "0",
                                            }}
                                        // valueLabelDisplay="auto"
                                        // valueLabelFormat={value => new Date(value).toLocaleString()}
                                        />
                                    </Box>
                                </>
                            }
                            {/* !isEditing && */ chartData &&
                                <Box position="relative" sx={{ height: CHART_HEIGHT, top: "-25px", mb: "-25px" }}>
                                    <Line ref={chartRef} options={chartOptions} data={chartData} />
                                </Box>
                            }
                        </Box>
                        {trackControls}
                    </Box>
                    <Box>
                        <Paper elevation={3} sx={{ minWidth: "21em", width: "21em" }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                {!isEditing && tripMetadata}
                                {!isEditing && <Divider />}
                                {trackEditButtons}
                                {trackEditButtons && <Divider />}
                                {tracklist}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </Container >
    );
}
