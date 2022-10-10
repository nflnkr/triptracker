import express from "express";
import userController from "../controllers/user";
import authController from "../controllers/auth";
import tripRouter from "./trip";

const router = express.Router();

// router.post("/", userController.createUser);
router.get("/", userController.getUser);
router.patch("/:username", userController.updateUser);
router.get("/:username", userController.getUserByName);
router.delete("/:username", userController.deleteUserByName);

export default router;