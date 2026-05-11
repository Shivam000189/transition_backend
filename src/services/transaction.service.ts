import { Prisma } from "@prisma/client";
import prisma from "../db/db.config";
import { getAccountBalance } from "./account.service";
import { sendTransactionEmail } from "./email.service";

const prismaClient = prisma as typeof prisma & {
  transaction: any;
};

type CreateTransactionInput = {
  authenticatedUserId: number;
  authenticatedUserEmail: string;
  authenticatedUserName: string;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  idempotencyKey: string;
};

type CreateInitialFundsInput = {
  systemUserId: number;
  toAccountId: number;
  amount: number;
  idempotencyKey: string;
};

async function ensureTransactionRequest(input: {
  fromAccountId?: number;
  toAccountId: number;
  amount: number;
  idempotencyKey: string;
}) {
  if (!input.toAccountId || !input.amount || !input.idempotencyKey) {
    throw new Error("toAccount, amount and idempotencyKey are required");
  }

  if (input.fromAccountId === undefined) {
    return;
  }

  if (!input.fromAccountId) {
    throw new Error("FromAccount, toAccount, amount and idempotencyKey are required");
  }
}

async function findExistingTransaction(idempotencyKey: string) {
  return prismaClient.transaction.findUnique({
    where: { idempotencyKey },
    include: {
      fromAccount: true,
      toAccount: true,
      ledgers: true,
    },
  });
}

function ensureExistingTransactionState(existingTransaction: Awaited<ReturnType<typeof findExistingTransaction>>) {
  if (!existingTransaction) {
    return;
  }

  if (existingTransaction.status === "COMPLETED") {
    throw new Error("Transaction already processed");
  }

  if (existingTransaction.status === "PENDING") {
    throw new Error("Transaction is still processing");
  }

  if (existingTransaction.status === "FAILED") {
    throw new Error("Transaction processing failed, please retry");
  }

  if (existingTransaction.status === "REVERSED") {
    throw new Error("Transaction was reversed, please retry");
  }
}

export async function createTransaction(input: CreateTransactionInput) {
  await ensureTransactionRequest(input);

  const existingTransaction = await findExistingTransaction(input.idempotencyKey);
  if (existingTransaction?.status === "COMPLETED") {
    return {
      message: "Transaction already processed",
      transaction: existingTransaction,
    };
  }
  ensureExistingTransactionState(existingTransaction);

  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findUnique({
      where: { id: input.fromAccountId },
      select: { id: true, userId: true, status: true },
    }),
    prisma.account.findUnique({
      where: { id: input.toAccountId },
      select: { id: true, status: true },
    }),
  ]);

  if (!fromAccount || !toAccount) {
    throw new Error("Invalid fromAccount or toAccount");
  }

  if (fromAccount.userId !== input.authenticatedUserId) {
    throw new Error("Invalid fromAccount or toAccount");
  }

  if (fromAccount.status !== "ACTIVE" || toAccount.status !== "ACTIVE") {
    throw new Error("Both fromAccount and toAccount must be ACTIVE to process transaction");
  }

  const balance = await getAccountBalance(input.fromAccountId, input.authenticatedUserId);
  if (balance < input.amount) {
    throw new Error(`Insufficient balance. Current balance is ${balance}. Requested amount is ${input.amount}`);
  }

  const amount = new Prisma.Decimal(input.amount);

  const transaction = await prisma.$transaction(async (tx) => {
    const txClient = tx as typeof tx & { transaction: any };

    const createdTransaction = await txClient.transaction.create({
      data: {
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amount,
        idempotencyKey: input.idempotencyKey,
        status: "PENDING",
      },
    });

    await tx.ledger.create({
      data: {
        accountId: input.fromAccountId,
        transactionId: createdTransaction.id,
        amount,
        type: "DEBIT",
      },
    });

    await tx.ledger.create({
      data: {
        accountId: input.toAccountId,
        transactionId: createdTransaction.id,
        amount,
        type: "CREDIT",
      },
    });

    return txClient.transaction.update({
      where: { id: createdTransaction.id },
      data: { status: "COMPLETED" },
      include: {
        fromAccount: true,
        toAccount: true,
        ledgers: true,
      },
    });
  });

  await sendTransactionEmail(
    input.authenticatedUserEmail,
    input.authenticatedUserName,
    input.amount,
    input.toAccountId,
  );

  return {
    message: "Transaction completed successfully",
    transaction,
  };
}

export async function createInitialFundsTransaction(input: CreateInitialFundsInput) {
  await ensureTransactionRequest(input);

  const existingTransaction = await findExistingTransaction(input.idempotencyKey);
  if (existingTransaction?.status === "COMPLETED") {
    return existingTransaction;
  }
  ensureExistingTransactionState(existingTransaction);

  const [systemAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({
      where: { userId: input.systemUserId },
      select: { id: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.account.findUnique({
      where: { id: input.toAccountId },
      select: { id: true, status: true },
    }),
  ]);

  if (!toAccount) {
    throw new Error("Invalid toAccount");
  }

  if (!systemAccount) {
    throw new Error("System user account not found");
  }

  if (systemAccount.status !== "ACTIVE" || toAccount.status !== "ACTIVE") {
    throw new Error("Both fromAccount and toAccount must be ACTIVE to process transaction");
  }

  const amount = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    const txClient = tx as typeof tx & { transaction: any };

    const transaction = await txClient.transaction.create({
      data: {
        fromAccountId: systemAccount.id,
        toAccountId: input.toAccountId,
        amount,
        idempotencyKey: input.idempotencyKey,
        status: "PENDING",
      },
    });

    await tx.ledger.create({
      data: {
        accountId: systemAccount.id,
        transactionId: transaction.id,
        amount,
        type: "DEBIT",
      },
    });

    await tx.ledger.create({
      data: {
        accountId: input.toAccountId,
        transactionId: transaction.id,
        amount,
        type: "CREDIT",
      },
    });

    return txClient.transaction.update({
      where: { id: transaction.id },
      data: { status: "COMPLETED" },
      include: {
        fromAccount: true,
        toAccount: true,
        ledgers: true,
      },
    });
  });
}
