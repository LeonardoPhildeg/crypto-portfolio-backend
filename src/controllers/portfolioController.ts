import { Request, Response } from 'express';
import { calcularPortfolio, gerarHistoricoEvolucao } from '../services/portfolioService';
import { exportPortfolioToJson, exportPortfolioToCsv } from '../utils/exportUtils';
import { PrismaClient, Investment, Sale } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Retorna a posição consolidada da carteira
 */
export const getPortfolio = async (_: Request, res: Response) => {
  try {
    const data = await calcularPortfolio();
    const totais = data.reduce(
      (acc, item) => {
        acc.lucroTotal = acc.lucroTotal.plus(new Decimal(item.valorRentabilidadeTotal));
        acc.investidoTotal = acc.investidoTotal.plus(new Decimal(item.investido));
        return acc;
      },
      { lucroTotal: new Decimal(0), investidoTotal: new Decimal(0) }
    );
    const allTimeProfit = {
      valor: totais.investidoTotal.toFixed(2),
      percentual: totais.lucroTotal.dividedBy(totais.investidoTotal).times(100).toFixed(2),
    };

    return res.json({ success: true, data, allTimeProfit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro ao calcular carteira' });
  }
};

/**
 * Retorna histórico de aportes e vendas por símbolo
 */
export const getTransactionHistory = async (req: Request, res: Response) => {
  const { symbol } = req.params;

  try {
    const crypto = await prisma.crypto.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        investments: true,
        sales: true,
      },
    });

    if (!crypto) {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }

    const historico = [
      ...crypto.investments.map((investment: Investment) => ({
        type: 'investment' as const,
        quantity: investment.quantity.toString(),
        price: investment.unitPriceUsd.toString(),
        date: investment.date,
      })),
      ...crypto.sales.map((sale: Sale) => ({
        type: 'sale' as const,
        quantity: sale.quantity.toString(),
        price: sale.unitPriceUsd.toString(),
        date: sale.date,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({ success: true, data: historico });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro ao obter histórico' });
  }
};

/**
 * Exporta dados da carteira em JSON
 */
export const exportToJson = async (_: Request, res: Response) => {
  try {
    const json = await exportPortfolioToJson();
    res.setHeader('Content-Disposition', 'attachment; filename=portfolio.json');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro na exportação JSON' });
  }
};

/**
 * Exporta dados da carteira em CSV
 */
export const exportToCsv = async (_: Request, res: Response) => {
  try {
    const csvPath = await exportPortfolioToCsv();
    res.download(csvPath, 'portfolio.csv');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro na exportação CSV' });
  }
};

export const consultarEvolucao = async (_req: Request, res: Response) => {
  try {
    const historico = await gerarHistoricoEvolucao();
    // return res.json({ success: true, data: historico });
    return res.json(historico);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro ao gerar histórico de evolução' });
  }
};
