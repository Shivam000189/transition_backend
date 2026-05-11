import { Router } from "express";
import {
  createInitialFundsTransactionController,
  createTransactionController,
} from "../controllers/transaction.controller";
import {
  authMiddleware,
  authSystemUserMiddleware,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createTransactionController);
router.post(
  "/system/initial-funds",
  authSystemUserMiddleware,
  createInitialFundsTransactionController,
);

export default router;
