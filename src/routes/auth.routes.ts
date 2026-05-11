import express, { Request, Response } from "express";
import { register, login, logout } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Register route
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

export default router;
