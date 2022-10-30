import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import { useAppSelector } from "../redux/hooks";

export default function Home() {
    const user = useAppSelector(state => state.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
    });

    return (
        <Container>Some average landing page</Container>
    );
}