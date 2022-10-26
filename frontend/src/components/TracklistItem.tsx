import { useMemo, useState } from "react";
import { ProcessedTrack, TrackType, trackTypes } from "../types/models";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardHeader, Checkbox, Divider, FormControl, MenuItem, Select, SelectChangeEvent, SvgIconTypeMap, useTheme } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { trackTypeIcons } from "../utils/trackTypeIcons";
import { formatDuration, intervalToDuration } from "date-fns";
import { useAppDispatch } from "../redux/hooks";
import { changeTrackType } from "../redux/tripsSlice";

interface Props {
    tripId: string;
    trackIndex: number;
    track: ProcessedTrack;
    selected?: boolean;
    onClick: () => void;
    editing?: boolean;
    shown?: boolean;
}

export default function TracklistItem({ tripId, trackIndex, track, selected = false, onClick, editing = false, shown = true }: Props) {
    const dispatch = useAppDispatch();

    function handleTrackTypeChange(event: SelectChangeEvent) {
        const newTrackType = event.target.value as TrackType;
        dispatch(changeTrackType({ tripId, trackIndex, newTrackType }));
    }

    const IconElement = trackTypeIcons[track.type];

    const durationText = useMemo(() => formatDuration(intervalToDuration({ start: new Date(track.startDate), end: new Date(track.endDate) })), [track]);

    return (
        <Card elevation={selected ? 3 : undefined} sx={{ width: "100%" }}>
            <CardHeader
                title="Track"
                subheader={new Date(track.startDate).toLocaleString()}
                onClick={onClick}
                avatar={<IconElement />}
                sx={{
                    cursor: "pointer",
                    py: 1
                }}
            />
            {selected &&
                <CardContent sx={{ p: 0, "&:last-child": { pb: selected ? 1 : 0 } }}>
                    <Divider />
                    <List dense={true}>
                        {editing ?
                            <ListItem sx={{ py: 0 }}>
                                <FormControl size="small">
                                    <Select
                                        value={track.type}
                                        onChange={handleTrackTypeChange}
                                        displayEmpty
                                    >
                                        {trackTypes.map(trackType =>
                                            <MenuItem key={trackType} value={trackType}>{trackType}</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </ListItem>
                            :
                            <>
                                <ListItem sx={{ py: 0 }}>
                                    <Typography variant="body2">Duration: {durationText}</Typography>
                                </ListItem>
                                <ListItem sx={{ py: 0 }}>
                                    <Typography variant="body2">End: {new Date(track.endDate).toLocaleString()}</Typography>
                                </ListItem>
                                <ListItem sx={{ py: 0 }}>
                                    <Typography variant="body2">Distance: {track.totalDistance.toFixed(0)} m</Typography>
                                </ListItem>
                                {/* <ListItem sx={{ py: 0 }}>
                                    <Typography variant="body2">Max speed: {(track.maxSpeed * 3.6).toFixed(1)} km/h</Typography>
                                </ListItem>
                                <ListItem sx={{ py: 0 }}>
                                    <Typography variant="body2">Avg speed: {(track.avgSpeed * 3.6).toFixed(1)} km/h</Typography>
                                </ListItem> */}
                            </>
                        }
                    </List>
                </CardContent>
            }
        </Card>
    );
}