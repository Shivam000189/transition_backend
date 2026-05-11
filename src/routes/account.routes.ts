import express from "express";
import {
  createAccountController,
  getAccountBalanceController,
  getUserAccountsController,
} from "../controllers/account.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, createAccountController);
router.get("/", authMiddleware, getUserAccountsController);
router.get("/balance/:accountId", authMiddleware, getAccountBalanceController);

export default router;
