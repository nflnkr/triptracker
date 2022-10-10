import express from "express";
import tileController from "../controllers/tile";

const router = express.Router();

router.get('/:style/:zoom/:x/:y', tileController.getTile);

export default router;