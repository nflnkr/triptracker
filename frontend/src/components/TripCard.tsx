import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, CardActionArea, CardActions, CardContent, CardMedia, List, ListItem, ListItemText, Skeleton } from "@mui/material";
import { useMemo, useRef } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import OlMapPreview from "./OlMapPreview";
import { trackTypeIcons } from "../utils/trackTypeIcons";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { deleteTrips } from "../redux/tripsSlice";
import { useIntersectionObserver } from "../utils/hooks";

interface Props {
    tripId: string;
    height: number;
}

export default function TripCard({ tripId, height }: Props) {
    const trips = useAppSelector(state => state.trips);
    const trip = useMemo(() => trips.find(trip => trip._id === tripId), [tripId, trips]);
    const dispatch = useAppDispatch();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const entry = useIntersectionObserver(cardRef, { rootMargin: "500px" });
    const isVisible = !!entry?.isIntersecting;

    async function handleTripDelete() {
        // TODO handle errors
        const result = await fetch("/api/trip/" + tripId, {
            method: "delete",
            credentials: "include"
        });
        const json = await result.json();
        if (json.success) {
            dispatch(deleteTrips([tripId]));
        } else {
            console.log("Trip delete failed", json);
        }
    }

    const trackTypeSequence = useMemo(() => trip?.tracks.flatMap((track, index, arr) => {
        const Icon = trackTypeIcons[track.type];
        if (index !== arr.length - 1) return [
            <Icon key={`${trip.startDate}${track.startDate}`} />,
            <ArrowRightIcon key={`${trip.startDate}${track.startDate}_arrow`} />
        ];
        return <Icon key={`${trip.startDate}${track.startDate}`} />;
    }), [trip?.startDate, trip?.tracks]);

    return (
        <Card elevation={1} sx={{ width: "100%" }} ref={cardRef} >
            {trip &&
                isVisible ?
                <>
                    <CardActionArea component={RouterLink} to={`/trip/${tripId}`} sx={{ display: "flex", alignItems: "flex-start" }} >
                        <CardMedia sx={{ flexGrow: 1 }}>
                            <OlMapPreview
                                width="100%"
                                height={`${height}px`}
                                tracks={trip.tracks}
                            />
                        </CardMedia>
                        <CardContent sx={{ p: 0 }}>
                            <List dense={true} sx={{ width: "100%", maxWidth: 360 }}>
                                <ListItem>
                                    <ListItemText sx={{ my: 0 }} primary="Trip" secondary={trip.name} />
                                </ListItem>
                                {trip.totalDistance &&
                                    <ListItem>
                                        <ListItemText sx={{ my: 0 }} primary="Distance" secondary={(trip.totalDistance / 1000).toFixed(3) + " km"} />
                                    </ListItem>
                                }
                                {trip.startDate &&
                                    <ListItem>
                                        <ListItemText sx={{ my: 0 }} primary="Date" secondary={new Date(trip.startDate).toLocaleString()} />
                                    </ListItem>
                                }
                                {trip.maxSpeed &&
                                    <ListItem>
                                        <ListItemText sx={{ my: 0 }} primary="Max speed" secondary={trip.maxSpeed.toFixed(1)} />
                                    </ListItem>
                                }
                                {trip.tracks.length &&
                                    <ListItem>
                                        <ListItemText sx={{ my: 0 }} primary="Tracks" secondary={trip.tracks.length} />
                                    </ListItem>
                                }
                            </List>
                        </CardContent>
                    </CardActionArea>
                    <CardActions sx={{ display: "flex", width: "100%" }}>
                        <Box sx={{ display: "flex", flexGrow: 1 }}>
                            {trackTypeSequence}
                        </Box>
                        <Box>
                            <Button size="small" color="error" variant="text" onClick={handleTripDelete} startIcon={<DeleteIcon />}>Delete</Button>
                        </Box>
                    </CardActions>
                </>
                :
                <TripCardSkeleton height={height + 46} />
            }
        </Card>
    );
}

function TripCardSkeleton({ height }: { height: number; }) {
    return (
        <Box sx={{ width: "100%", height, display: "flex", padding: 2, gap: 2 }}>
            <Box sx={{ flexGrow: 3 }} >
                <Skeleton height={height - 32} variant="rectangular" />
            </Box>
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
            </Box>
        </Box>
    );
}