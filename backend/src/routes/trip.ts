import express from "express";
import tripController from "../controllers/trip";
import multer from "multer";

const router = express.Router({ mergeParams: true });

router.post("/", tripController.createTrip);
router.get("/", tripController.getTripsByUsername);
router.patch("/:tripId", tripController.updateTripById);
router.get("/:tripId", tripController.getTripById);
router.delete("/:tripId", tripController.deleteTripById);

export default router;