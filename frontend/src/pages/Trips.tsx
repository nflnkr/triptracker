import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import TripCard from "../components/TripCard";
import { useAppSelector } from "../redux/hooks";

// TODO virtualized list
// TODO sort by date/distance
export default function Trips() {
    const trips = useAppSelector(state => state.trips)
    /* function sortFunction(trip1: TripMeta, trip2: TripMeta) {
        return trip2.startDate - trip1.startDate;
    } */

    return (
        <Container maxWidth="md">
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h4">My trips</Typography>
            </Box>
            {trips && trips.length > 0 ?
                <List>
                    {trips/* .sort(sortFunction) */.map(trip =>
                        <ListItem key={trip._id} disableGutters>
                            <TripCard tripId={trip._id} height={260} />
                        </ListItem>
                    )}
                </List>
                :
                <Typography variant="h5" sx={{ textAlign: "center", m: 3 }}>Nothing here 😞</Typography>
            }
        </Container>
    )
}