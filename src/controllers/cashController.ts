import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export const getCash = async (_req: Request, res: Response) => {
  const cash = await prisma.cash.findUnique({ where: { id: 1 } });
  return res.json({ usdBalance: cash?.usdBalance.toFixed(2) ?? '0.00' });
};

export const addCash = async (req: Request, res: Response) => {
  const { amount } = req.body;
  const decimalAmount = new Prisma.Decimal(amount);

  // Verifica se é maior que zero
  if (decimalAmount.lte(0)) {
    return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
  }

  // Verifica se tem no máximo 2 casas decimais
  if (decimalAmount.decimalPlaces() > 2) {
    return res.status(400).json({ error: 'O valor deve conter no máximo 2 casas decimais.' });
  }

  const usdBalance = await prisma.cash.upsert({
    where: { id: 1 },
    update: { usdBalance: { increment: decimalAmount } },
    create: { id: 1, usdBalance: decimalAmount },
  });

  return res.json({ usdBalance: usdBalance.usdBalance.toString() });
};

export const cashWithdrawal = async (amount: number | string, res: Response) => {
  const decimalAmount = new Prisma.Decimal(amount);

  // Verifica se é maior que zero
  if (decimalAmount.lte(0)) {
    return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
  }

  // Verifica se tem no máximo 2 casas decimais
  if (decimalAmount.decimalPlaces() > 2) {
    return res.status(400).json({ error: 'O valor deve conter no máximo 2 casas decimais.' });
  }

  await prisma.cash.update({
    where: { id: 1 },
    data: { usdBalance: { decrement: decimalAmount } },
  });
};

export const cashCreditOnSale = async (amount: Decimal | string) => {
  await prisma.cash.update({
    where: { id: 1 },
    data: { usdBalance: { increment: amount } },
  });
};
