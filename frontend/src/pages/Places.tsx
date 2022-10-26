import {
    Box,
    Button,
    Container,
    Divider,
    List,
    ListItem,
    Paper,
    TextField
} from "@mui/material";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import OlMapPlaces from "../components/OlMapPlaces";
import PlacelistItem from "../components/PlacelistItem";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addPlace, removePlace, setPlaces } from "../redux/placesSlice";
import { PointOfInterest } from "../types/models";

const initialNewPlace: PointOfInterest = {
    createdAt: Date.now(),
    description: "",
    name: "",
    id: "",
    lat: 0,
    lon: 0,
};

type CreatingPlaceStatus = "idle" | "adding" | "added" | "sending";

// TODO place categories
export default function Places() {
    const places = useAppSelector(state => state.places);
    const dispatch = useAppDispatch();
    const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
    const [creatingPlaceStatus, setCreatingPlaceStatus] = useState<CreatingPlaceStatus>("idle");
    const [newPlace, setNewPlace] = useState<PointOfInterest>(initialNewPlace);

    const fetchPlaces = useCallback(async function fetchPlaces(abortController?: AbortController) {
        try {
            const response = await fetch("/api/places/", { credentials: "include", signal: abortController?.signal });
            const result = await response.json();
            const places = result.places as PointOfInterest[];

            dispatch(setPlaces(places));
            setSelectedPlaceIndex(0);
        } catch (error) {
            console.log("Error setting places", error);
        }
    }, [dispatch]);

    useEffect(function getPlaces() {
        if (!fetchPlaces) return;

        const controller = new AbortController();
        fetchPlaces(controller);

        return () => controller.abort();
    }, [fetchPlaces]);

    const handleDrawEnd = useCallback((lon: number, lat: number) => {
        setNewPlace(prevPlace => ({ ...prevPlace, lat, lon }));
    }, []);

    async function handleCreatePlace() {
        setCreatingPlaceStatus("sending");
        try {
            const response = await fetch("/api/places/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ place: newPlace })
            });
            const result = await response.json();
            if (result.success) {
                setCreatingPlaceStatus("idle");
                dispatch(addPlace(result.place as PointOfInterest));
            } else {
                setCreatingPlaceStatus("idle");
            }
        } catch (error) {
            setCreatingPlaceStatus("idle");
        }
    }

    function handleCancelCreatingPlace() {
        setCreatingPlaceStatus("idle");
        setNewPlace(prevPlace => ({ ...prevPlace, name: "", description: "" }));
    }

    const handleDeletePlace = useCallback(async (placeId: string, index: number) => {
        try {
            const response = await fetch("/api/places/" + placeId, {
                method: "delete",
                credentials: "include"
            });
            const result = await response.json();
            if (result.success) {
                dispatch(removePlace(placeId));
            } else {
                console.log("Place delete failed", result);
            }
        } catch (error) {
            console.log("Place delete failed", error);
        }
    }, [dispatch]);

    const placesList = useMemo(() => {
        if (!places?.length) return;
        return (
            <List dense={false} sx={{ overflowY: "auto", flexGrow: 1 }} >
                {places.map((place, index) => (
                    <ListItem key={place.id} sx={{ width: "auto", alignItems: "start" }}>
                        <PlacelistItem
                            place={place}
                            selected={index === selectedPlaceIndex}
                            onClick={() => setSelectedPlaceIndex(index)}
                            deletePlaceHandler={() => handleDeletePlace(place.id, index)}
                        />
                    </ListItem>
                ))}
            </List>);
    }, [handleDeletePlace, places, selectedPlaceIndex]);

    return (
        <Container maxWidth="xl">
            <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: "21em", flexGrow: 1, width: "21em" }}>
                    <Paper elevation={3} sx={{ width: "100%" }} >
                        <OlMapPlaces
                            selectedPlaceIndex={selectedPlaceIndex}
                            isDraw={creatingPlaceStatus === "adding"}
                            handleDrawEnd={handleDrawEnd}
                        />
                    </Paper>
                </Box>
                <Box>
                    <Paper elevation={3} sx={{ minWidth: "21em", width: "21em" }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, p: 1 }}>
                            {creatingPlaceStatus === "idle" &&
                                <Button onClick={() => setCreatingPlaceStatus("adding")} sx={{ flex: "1 1 99%" }} size="small" variant="contained">New place</Button>
                            }
                            {creatingPlaceStatus === "adding" &&
                                <>
                                    <Button onClick={handleCreatePlace} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Save</Button>
                                    <Button onClick={handleCancelCreatingPlace} sx={{ flex: "1 1 40%" }} size="small" variant="contained">Cancel</Button>
                                    <TextField
                                        value={newPlace?.name || ""}
                                        onChange={event => setNewPlace(prevPlace => ({ ...prevPlace, name: event.target.value }))}
                                        fullWidth
                                        variant="standard"
                                        label="Name"
                                    />
                                    <TextField
                                        value={newPlace?.description || ""}
                                        onChange={event => setNewPlace(prevPlace => ({ ...prevPlace, description: event.target.value }))}
                                        fullWidth
                                        variant="standard"
                                        label="Description"
                                        multiline
                                    />
                                </>
                            }
                        </Box>
                        <Divider />
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            {placesList}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
}