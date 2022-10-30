import {
    Alert,
    Box,
    Button,
    Checkbox,
    Container,
    FormControlLabel,
    Link,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography
} from "@mui/material";
import { ChangeEvent, useContext, useRef, useState } from "react";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import { Link as RouterLink } from "react-router-dom";
import { useAppDispatch } from "../redux/hooks";
import { addTrips } from "../redux/tripsSlice";
import { processTrip } from "../utils/trackDataCalcs";
import { Trip } from "../types/models";


type UploadState = "idle" | "withfiles" | "loading";
type UploadResult = "error" | "success" | null;

export default function CreateTrip() {
    const dispatch = useAppDispatch();
    const [tripNameFieldValue, setTripNameFieldValue] = useState<string>("");
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [uploadResult, setUploadResult] = useState<UploadResult>(null);
    const [files, setFiles] = useState<File[] | null>(null);
    const [sameTrip, setSameTrip] = useState<boolean>(false);
    const [uploadedTripId, setUploadedTripId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleChooseFileClick() {
        fileInputRef.current?.click();
    }

    // TODO drag and drop files onto page
    // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
    // https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (!event.target.files) return setFiles(null);
        setFiles(Array.from(event.target.files));
        setUploadState("withfiles");
        setUploadResult(null);
    }

    async function handleTripUpload() {
        if (!files) return;

        setUploadState("loading");

        const formData = new FormData();
        const tripname = Boolean(tripNameFieldValue) ? tripNameFieldValue.replace(/\.[^.]+$/, "") : "Unnamed trip";
        formData.append("name", tripname);
        formData.append("sameTrip", sameTrip.toString());
        for (let file of files) {
            formData.append("gpxfile", file);
        }

        try {
            const response = await fetch("/api/gpx", {
                method: "post",
                body: formData,
                credentials: "include"
            });
            const result = await response.json();
            if (result.success) {
                const trips = result.trips as Trip[];
                setUploadResult("success");
                setUploadState("idle");
                setFiles(null);
                setUploadedTripId(trips[0]._id);
                const processedTrips = trips.map(trip => processTrip(trip));
                dispatch(addTrips(processedTrips));
            } else {
                console.log(result);
                setUploadState("idle");
                setFiles(null);
                setUploadResult("error");
                setUploadedTripId(null);
                if (fileInputRef.current) fileInputRef.current.files = null;
            }
        } catch (error) {
            console.log(error);
            setUploadResult("error");
            setUploadState("idle");
            setFiles(null);
            setUploadedTripId(null);
            if (fileInputRef.current) fileInputRef.current.files = null;
        }
    }

    return (
        <Container maxWidth="md">
            <Typography variant="h4" >Create trip</Typography>
            {uploadResult &&
                <Alert severity={uploadResult} sx={{ my: 2 }}>
                    {uploadResult === "success" && uploadedTripId ?
                        <Link component={RouterLink} to={`/trip/${uploadedTripId}`} >Trip uploaded!</Link>
                        :
                        "Error"
                    }
                </Alert>
            }
            <TextField
                sx={{ my: 2 }}
                fullWidth
                value={tripNameFieldValue}
                onChange={e => setTripNameFieldValue(e.target.value)}
                label="Trip name"
                id="gpxfilename"
                type="text"
                name="gpxfilename"
            />
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                    variant="contained"
                    onClick={handleChooseFileClick}
                >
                    Choose files
                    <input
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        type="file"
                        id="gpx-file"
                        multiple
                        accept=".gpx"
                    />
                </Button>
                <FormControlLabel
                    control={<Checkbox
                        checked={sameTrip}
                        onChange={e => setSameTrip(e.target.checked)}
                        color="info"
                    />}
                    label="As one trip"
                    sx={{ flexGrow: 1 }}
                />
                <LoadingButton
                    color="primary"
                    onClick={handleTripUpload}
                    disabled={uploadState === "idle"}
                    loading={uploadState === "loading"}
                    loadingPosition="start"
                    startIcon={<SaveIcon />}
                    variant="contained"
                >
                    Upload
                </LoadingButton>
            </Box>
            <List dense>
                {files?.map((file, i) =>
                    <ListItem key={i}>
                        <ListItemText primary={file.name} />
                    </ListItem>
                )}
            </List>
        </Container>
    );
}