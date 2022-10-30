import React, { useContext } from "react";
import Logo from "../assets/logo.svg";
import styled from "styled-components/macro";
import {
    Link as RouterLink, useNavigate
} from "react-router-dom";
import {
    Button,
    AppBar,
    Toolbar,
    Box,
    IconButton,
    Avatar,
    Menu,
    Typography,
    MenuItem
} from "@mui/material";
import { deepOrange, deepPurple } from "@mui/material/colors";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { setUser } from "../redux/userSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

const LogoContainer = styled.img`
    height: 46px;
    padding: 4px;
`;

export default function Navbar() {
    const user = useAppSelector(state => state.user);
    const dispatch = useAppDispatch();
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const navigate = useNavigate();

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    function logoutUser() {
        setAnchorElUser(null);
        fetch("/api/auth/logout", { method: "post", credentials: "include" })
            .then(result => result.json())
            .then(json => console.log("logout response: ", json));
        dispatch(setUser(null));
        navigate("/");
    }

    const buttonSx = {
        my: 2,
        color: "white",
        display: "block",
        mt: "0px",
        mb: "0px",
    };

    return (
        <AppBar position="static" enableColorOnDark>
            <Toolbar>
                <LogoContainer alt="logo" src={Logo} />
                <Box sx={{ display: "flex", flexGrow: 1, gap: 1 }}>
                    <Button sx={buttonSx} to="/" component={RouterLink}>Home</Button>
                    {user && <Button sx={buttonSx} to="/trips" component={RouterLink}>Trips</Button>}
                    {user && <Button sx={buttonSx} to="/places" component={RouterLink}>Places</Button>}
                </Box>
                {user ?
                    <Box
                        display="flex"
                        alignItems="center"
                        gap="12px"
                    >
                        <IconButton component={RouterLink} to="/create" color="inherit">
                            <AddCircleIcon />
                        </IconButton>
                        <Box>
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar sx={{ bgcolor: deepPurple[500] }} alt="avatar">{user.username[0].toUpperCase()}</Avatar>
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                {/* <MenuItem onClick={handleCloseUserMenu}>
                                    <Typography textAlign="center">Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleCloseUserMenu}>
                                    <Typography textAlign="center">Settings</Typography>
                                </MenuItem> */}
                                <MenuItem onClick={logoutUser}>
                                    <Typography textAlign="center">Log out</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Box>
                    :
                    <Button sx={buttonSx} to="/login" component={RouterLink}>Sign in</Button>
                }
            </Toolbar>
        </AppBar>
    );
}
