import { Response } from "express";
import {
  createAccount,
  getAccountBalance,
  getUserAccounts,
} from "../services/account.service";
import { AuthenticatedRequest } from "../types/auth-request";

function handleAccountError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  const statusCode =
    message === "Account not found" ? 404 :
    message === "User not found" ? 404 :
    400;

  return res.status(statusCode).json({ success: false, error: message });
}

export async function createAccountController(req: AuthenticatedRequest, res: Response) {
  try {
    const account = await createAccount({
      userId: req.user!.id,
      currency: req.body.currency,
      status: req.body.status,
    });

    res.status(201).json({ success: true, account });
  } catch (error) {
    handleAccountError(res, error);
  }
}

export async function getUserAccountsController(req: AuthenticatedRequest, res: Response) {
  try {
    const accounts = await getUserAccounts(req.user!.id);
    res.status(200).json({ success: true, accounts });
  } catch (error) {
    handleAccountError(res, error);
  }
}

export async function getAccountBalanceController(req: AuthenticatedRequest, res: Response) {
  try {
    const accountId = Number(req.params.accountId);

    const balance = await getAccountBalance(accountId, req.user!.id);

    res.status(200).json({
      success: true,
      accountId,
      balance,
    });
  } catch (error) {
    handleAccountError(res, error);
  }
}
