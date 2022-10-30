import { Box, Container, List, ListItem, Typography } from "@mui/material";
import TripCard from "../components/TripCard";
import { useAppSelector } from "../redux/hooks";

// TODO virtualized list
// TODO sort by date/distance
export default function Trips() {
    const trips = useAppSelector(state => state.trips);

    return (
        <Container maxWidth="md" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h4">My trips</Typography>
            </Box>
            {!!trips.length ?
                <List>
                    {trips.map(trip =>
                        <ListItem key={trip._id} disableGutters>
                            <TripCard tripId={trip._id} height={260} />
                        </ListItem>
                    )}
                </List>
                :
                <Typography variant="h5" sx={{ textAlign: "center", m: 3 }}>Nothing here 😞</Typography>
            }
        </Container>
    );
}