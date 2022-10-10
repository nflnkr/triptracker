import { Container, Typography } from "@mui/material";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

export default function NotFound() {
    return (
        <Container sx={{textAlign: "center", pt: 2}}>
            <Typography variant="h4">
                Page not found <SentimentDissatisfiedIcon />
            </Typography>
        </Container>
    )
}