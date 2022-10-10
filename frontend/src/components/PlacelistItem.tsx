import { Card, CardContent, CardHeader, Divider, List, ListItem, FormControl, Select, MenuItem, Typography, Box, IconButton } from "@mui/material";
import { PointOfInterest, trackTypes } from "../types/models";
import PlaceIcon from "@mui/icons-material/Place";
import { toStringHDMS } from "ol/coordinate";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
    place: PointOfInterest;
    selected?: boolean;
    onClick: () => void;
    deletePlaceHandler: () => void;
}

export default function PlacelistItem({ place, selected = false, onClick, deletePlaceHandler }: Props) {
    return (
        <Card elevation={selected ? 3 : undefined} sx={{ width: "100%" }}>
            <CardHeader
                title={place.name}
                subheader={new Date(place.createdAt).toLocaleString()}
                onClick={onClick}
                avatar={<PlaceIcon />}
                sx={{
                    cursor: "pointer",
                    py: 1
                }}
                action={
                    <IconButton onClick={deletePlaceHandler}>
                        <DeleteIcon />
                    </IconButton>
                }
            />
            <Divider />
            {selected &&
                <CardContent>
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>{toStringHDMS([place.lon, place.lat])}</Typography>
                        <Typography variant="body2">{place.description}</Typography>
                    </Box>
                </CardContent>
            }
        </Card>
    );
}