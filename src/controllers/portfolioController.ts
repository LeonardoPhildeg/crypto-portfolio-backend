import { Request, Response } from 'express';
import {
  calcularPortfolio,
  calculaTotais,
  gerarHistoricoEvolucao,
  getCotacaoDolar,
} from '../services/portfolioService';
import { exportPortfolioToJson, exportPortfolioToCsv } from '../utils/exportUtils';
import { PrismaClient, Investment, Sale } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Retorna a posição consolidada da carteira
 */
export const getPortfolio = async (_: Request, res: Response) => {
  try {
    const cotacaoDolar = await getCotacaoDolar();
    const data = await calcularPortfolio(cotacaoDolar);
    const totais = await calculaTotais(data);

    return res.json({ success: true, data, totais, cotacaoDolar: cotacaoDolar.toFixed(2) });
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
