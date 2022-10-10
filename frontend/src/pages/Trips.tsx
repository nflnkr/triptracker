import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/user";
import TripCard from "../components/TripCard";
import { Trip, TripMeta } from "../types/models";

// TODO virtualized list
// TODO sort by date/distance
export default function Trips() {
    const { user } = useContext(UserContext);

    /* function sortFunction(trip1: TripMeta, trip2: TripMeta) {
        return trip2.startDate - trip1.startDate;
    } */

    return (
        <Container maxWidth="md">
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h4">My trips</Typography>
            </Box>
            {user && user.trips.length > 0 ?
                <List>
                    {user.trips/* .sort(sortFunction) */.map(trip =>
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