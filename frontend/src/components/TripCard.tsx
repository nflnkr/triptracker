import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, CardActionArea, CardActions, CardContent, CardMedia, List, ListItem, ListItemText, Skeleton, useTheme } from "@mui/material";
import { ProcessedTrip, Trip } from "../types/models";
import { useContext, useEffect, useState } from "react";
import { createOlMap } from "../utils/olMap";
import { Map } from "ol";
import OlMap from "./OlMap";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { UserContext } from "../contexts/user";
import { processTrip } from "../utils/trackDataCalcs";
import OlMapPreview from "./OlMapPreview";
import { trackTypeIcons } from "../utils/trackTypeIcons";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

interface Props {
    tripId: string;
    height: number;
}

export default function TripCard({ tripId, height }: Props) {
    const theme = useTheme();
    const { user, setUser } = useContext(UserContext);
    const [trip, setTrip] = useState<ProcessedTrip | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/trip/" + tripId, { credentials: "include", signal: controller.signal })
            .then(result => result.json())
            .then(json => {
                setTrip(processTrip(json.trip));
            }).catch(error => {
                console.log("Error fetching trip", error);
            });
        return () => {
            controller.abort();
        };
    }, [tripId]);

    async function handleTripDelete() {
        // TODO handle errors
        const result = await fetch("/api/trip/" + tripId, {
            method: "delete",
            credentials: "include"
        });
        const json = await result.json();
        if (json.success) {
            setUser(prevUser => ({
                username: prevUser!.username,
                trips: prevUser!.trips.filter(trip => trip._id !== tripId),
                places: prevUser!.places
            }));
        } else {
            console.log("Trip delete failed", json);
        }
    }

    const trackTypeSequence = trip?.tracks.flatMap((track, index, arr) => {
        const Icon = trackTypeIcons[track.type];
        if (index !== arr.length - 1) return [
            <Icon key={`${trip.startDate}${track.startDate}`} />,
            <ArrowRightIcon key={`${trip.startDate}${track.startDate}_arrow`} />
        ];
        return <Icon key={`${trip.startDate}${track.startDate}`} />;
    });

    return (
        <Card elevation={1} sx={{ width: "100%" }} >
            {trip &&
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
            }
        </Card>
    );
}