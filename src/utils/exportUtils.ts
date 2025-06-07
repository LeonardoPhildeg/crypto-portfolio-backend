import fs from 'fs';
import path from 'path';
import { calcularPortfolio } from '../services/portfolioService';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Gera exportação da carteira consolidada em JSON
 */
export const exportPortfolioToJson = async () => {
  const data = await calcularPortfolio();
  return data;
};

/**
 * Gera exportação da carteira consolidada em CSV e salva arquivo local
 */
export const exportPortfolioToCsv = async () => {
  const data = await calcularPortfolio();
  const csvWriter = createObjectCsvWriter({
    path: path.resolve(__dirname, '../../portfolio.csv'),
    header: [
      { id: 'symbol', title: 'Ativo' },
      { id: 'quantity', title: 'Quantidade' },
      { id: 'averagePrice', title: 'Preço Médio (USD)' },
      { id: 'currentPriceUsd', title: 'Cotação Atual (USD)' },
      { id: 'currentValueUsd', title: 'Valor Atual (USD)' },
      { id: 'currentValueBrl', title: 'Valor Atual (BRL)' },
      { id: 'rentabilidade', title: 'Rentabilidade (%)' }
    ]
  });

  await csvWriter.writeRecords(data as any[]);
  return path.resolve(__dirname, '../../portfolio.csv');
};
