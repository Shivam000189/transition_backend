

import { AccountStatus, LedgerType, Prisma } from "@prisma/client";
import prisma from "../db/db.config";

type CreateAccountInput = {
  userId: number;
  currency?: string;
  status?: AccountStatus;
};

type CreateLedgerEntryInput = {
  accountId: number;
  transactionId: number;
  type: LedgerType;
  amount: number;
  description?: string;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? value.toNumber() : 0;
}

export async function createAccount({
  userId,
  currency = "INR",
  status = AccountStatus.ACTIVE,
}: CreateAccountInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.account.create({
    data: {
      userId,
      currency,
      status,
    },
  });
}

export async function createLedgerEntry({
  accountId,
  transactionId,
  type,
  amount,
  description,
}: CreateLedgerEntryInput) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, status: true },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  if (account.status !== AccountStatus.ACTIVE) {
    throw new Error("Only active accounts can accept ledger entries");
  }

  return prisma.ledger.create({
    data: {
      accountId,
      transactionId,
      type,
      amount: new Prisma.Decimal(amount),
      description,
    },
  });
}

export async function getAccountBalance(accountId: number, userId?: number) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, userId: true },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  if (userId && account.userId !== userId) {
    throw new Error("Account not found");
  }

  const grouped = await prisma.ledger.groupBy({
    by: ["type"],
    where: { accountId },
    _sum: { amount: true },
  });

  const totalCredit = grouped.find((entry) => entry.type === LedgerType.CREDIT);
  const totalDebit = grouped.find((entry) => entry.type === LedgerType.DEBIT);

  return (
    decimalToNumber(totalCredit?._sum.amount) -
    decimalToNumber(totalDebit?._sum.amount)
  );
}

export async function getUserAccounts(userId: number) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
