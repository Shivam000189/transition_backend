import { Response } from "express";
import {
  createInitialFundsTransaction,
  createTransaction,
} from "../services/transaction.service";
import { AuthenticatedRequest } from "../types/auth-request";

function handleTransactionError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  const statusCode =
    message === "Transaction already processed" ? 200 :
    message === "Transaction is still processing" ? 200 :
    message === "Account not found" ? 404 :
    message === "System user account not found" ? 404 :
    message.startsWith("Insufficient balance") ? 400 :
    400;

  return res.status(statusCode).json({ success: statusCode < 300, message });
}

export async function createTransactionController(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await createTransaction({
      authenticatedUserId: req.user!.id,
      authenticatedUserEmail: req.user!.email,
      authenticatedUserName: req.user!.name,
      fromAccountId: Number(req.body.fromAccount),
      toAccountId: Number(req.body.toAccount),
      amount: Number(req.body.amount),
      idempotencyKey: req.body.idempotencyKey,
    });

    const statusCode = result.message === "Transaction already processed" ? 200 : 201;
    res.status(statusCode).json({
      success: true,
      message: result.message,
      transaction: result.transaction,
    });
  } catch (error) {
    handleTransactionError(res, error);
  }
}

export async function createInitialFundsTransactionController(req: AuthenticatedRequest, res: Response) {
  try {
    const transaction = await createInitialFundsTransaction({
      systemUserId: req.user!.id,
      toAccountId: Number(req.body.toAccount),
      amount: Number(req.body.amount),
      idempotencyKey: req.body.idempotencyKey,
    });

    res.status(201).json({
      success: true,
      message: "Initial funds transaction completed successfully",
      transaction,
    });
  } catch (error) {
    handleTransactionError(res, error);
  }
}
