import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import HikingIcon from "@mui/icons-material/Hiking";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import FlightIcon from "@mui/icons-material/Flight";
import TramIcon from "@mui/icons-material/Tram";
import { TrackType } from "../types/models";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";

export const trackTypeIcons: { [Property in TrackType]: OverridableComponent<SvgIconTypeMap<{}, "svg">> } = {
    "other": RouteIcon,
    "walking": DirectionsWalkIcon,
    "running": DirectionsRunIcon,
    "hiking": HikingIcon,
    "cycling": DirectionsBikeIcon,
    "car": TimeToLeaveIcon,
    "bus": DirectionsBusIcon,
    "tram": TramIcon,
    "train": TrainIcon,
    "air": FlightIcon,
};