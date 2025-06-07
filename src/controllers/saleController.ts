import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { cashCreditOnSale } from './cashController';

const prisma = new PrismaClient();

export const createSale = async (req: Request, res: Response) => {
  const { symbol, quantity, unitPriceUsd, date } = req.body;

  try {
    const crypto = await prisma.crypto.findUnique({ where: { symbol } });
    if (!crypto) {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }

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

    // Cálculo do valor total recebido pela venda (usando Decimal)
    const valorTotalRecebido = decimalQuantity.mul(decimalUnitPrice).toDecimalPlaces(2);

    const sale = await prisma.sale.create({
      data: {
        cryptoId: crypto.id,
        quantity: decimalQuantity,
        unitPriceUsd: decimalUnitPrice,
        date: new Date(date),
      },
    });

    // Credita o valor recebido no caixa
    await cashCreditOnSale(valorTotalRecebido);

    return res.status(201).json({ success: true, data: sale });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro ao registrar venda.' });
  }
};
