import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cria um novo aporte (depósito) para o ativo informado,
 * validando o saldo em caixa antes da operação.
 */
export const createInvestment = async (req: Request, res: Response) => {
  const { symbol, quantity, unitPriceUsd, date } = req.body;

  try {
    const decimalQuantity = new Prisma.Decimal(quantity).toDecimalPlaces(6);
    const decimalUnitPrice = new Prisma.Decimal(unitPriceUsd).toDecimalPlaces(2);

    // Validação: quantity deve ter exatamente 6 casas decimais
    if (!/^\d+\.\d{6}$/.test(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'A quantidade de tokens deve conter exatamente 6 casas decimais.',
      });
    }

    // Validação: unitPriceUsd deve ter exatamente 2 casas decimais
    if (!/^\d+\.\d{2}$/.test(unitPriceUsd)) {
      return res.status(400).json({
        success: false,
        error: 'O preço do token deve conter exatamente 2 casas decimais.',
      });
    }

    const decimalTotal = decimalQuantity.times(decimalUnitPrice);

    await prisma.$transaction(async tx => {
      // 1. Verifica saldo em caixa
      const caixa = await tx.cash.findUnique({ where: { id: 1 } });
      const saldoAtual = caixa?.usdBalance ?? new Prisma.Decimal(0);

      if (saldoAtual.lt(decimalTotal)) {
        throw {
          status: 400,
          message: `Saldo insuficiente em caixa. Saldo atual: $${saldoAtual.toFixed(2)}, necessário: $${decimalTotal.toFixed(2)}`,
        };
      }

      // 2. Upsert do ativo
      const crypto = await tx.crypto.upsert({
        where: { symbol },
        update: {},
        create: { symbol, name: symbol },
      });

      // 3. Criação do aporte
      await tx.investment.create({
        data: {
          cryptoId: crypto.id,
          quantity: decimalQuantity,
          totalUsdValue: decimalTotal,
          unitPriceUsd: decimalUnitPrice,
          date: new Date(date),
        },
      });

      // 4. Débito do caixa
      await tx.cash.update({
        where: { id: 1 },
        data: {
          usdBalance: { decrement: decimalTotal },
        },
      });
    });

    return res.status(201).json({ success: true, message: 'Aporte registrado com sucesso' });
  } catch (err: any) {
    if (err?.status === 400) {
      return res.status(400).json({ success: false, error: err.message });
    }

    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro ao registrar o aporte' });
  }
};
