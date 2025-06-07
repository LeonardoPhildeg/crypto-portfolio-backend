import { PrismaClient, Investment, Sale } from '@prisma/client';
import axios from 'axios';
import { Decimal } from '@prisma/client/runtime/library';
import { calcularPrecoMedio } from '../utils/precoMedio';

const prisma = new PrismaClient();

export interface Ativo {
  symbol: string;
  name: string;
  quantity: string;
  averagePrice: string;
  currentPriceUsd: string;
  currentValueUsd: string;
  currentValueBrl: string;
  investido: string;
  rentabilidadeTotal: string;
  valorRentabilidadeTotal: string;
}

export const calcularPortfolio = async (symbolFilter?: string): Promise<Ativo[]> => {
  const cryptos = await prisma.crypto.findMany({
    include: {
      investments: true,
      sales: true,
    },
  });

  const cotacaoDolar = await getCotacaoDolar();
  const ativos: Ativo[] = [];

  for (const crypto of cryptos) {
    const { investments, sales } = crypto;

    const totalTokensComprados = investments.reduce(
      (sum, i) => sum.plus(i.quantity),
      new Decimal(0)
    );
    const totalVendido = sales.reduce((sum, s) => sum.plus(s.quantity), new Decimal(0));
    const saldoAtual = totalTokensComprados.minus(totalVendido);

    if (saldoAtual.lte(0) && !symbolFilter) continue;

    // const precoMedioPosicaoAtual = calcularPrecoMedioPosicaoAtual(investments, sales);

    const totalValorInvestido = investments.reduce(
      (sum, investment) => sum.plus(investment.totalUsdValue),
      new Decimal(0)
    );

    const cotacaoAtual = await getCotacaoCripto(crypto.symbol);
    const valorAtualUsd = saldoAtual.mul(cotacaoAtual);
    const valorAtualBrl = valorAtualUsd.mul(cotacaoDolar);

    const totalInvestido = investments.reduce(
      (sum, i) => sum.plus(i.totalUsdValue),
      new Decimal(0)
    );
    console.log(totalInvestido.dividedBy(totalTokensComprados));

    const valorRealizadoVendas = sales.reduce(
      (sum, s) => sum.plus(s.quantity).times(s.unitPriceUsd),
      new Decimal(0)
    );

    // RENTABILIDADE TOTAL
    const rentabilidadeTotal = totalInvestido.gt(0)
      ? valorAtualUsd.plus(valorRealizadoVendas).minus(totalInvestido).div(totalInvestido).mul(100)
      : new Decimal(0);
    const valorRentabilidadeTotal = valorAtualUsd.plus(valorRealizadoVendas).minus(totalInvestido);

    ativos.push({
      symbol: crypto.symbol,
      name: crypto.name,
      quantity: saldoAtual.toFixed(6),
      averagePrice: totalValorInvestido.toFixed(2),
      currentPriceUsd: cotacaoAtual.toFixed(2),
      currentValueUsd: valorAtualUsd.toFixed(2),
      currentValueBrl: valorAtualBrl.toFixed(2),
      investido: totalInvestido.toFixed(2),
      rentabilidadeTotal: rentabilidadeTotal.toFixed(2),
      valorRentabilidadeTotal: valorRentabilidadeTotal.toFixed(2),
    });
  }

  if (symbolFilter) {
    const result = ativos.find(a => a.symbol.toLowerCase() === symbolFilter.toLowerCase());
    if (!result) throw new Error('Ativo não encontrado');
    return [result];
  }

  return ativos;
};

const getCotacaoCripto = async (symbol: string): Promise<Decimal> => {
  try {
    const res = await axios.get(
      `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`
    );
    return new Decimal(res.data.USD);
  } catch (err) {
    console.error(`Erro ao obter cotação de ${symbol}`, err);
    return new Decimal(0);
  }
};

const getCotacaoDolar = async (): Promise<Decimal> => {
  try {
    const res = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    return new Decimal(res.data.USDBRL.bid);
  } catch (err) {
    console.error('Erro ao obter cotação do dólar', err);
    return new Decimal(0.0); // fallback
  }
};

export const gerarHistoricoEvolucao = async () => {
  const cryptos = await prisma.crypto.findMany({
    include: { investments: true, sales: true },
  });

  const cotacoes = new Map<string, number>();
  for (const crypto of cryptos) {
    const preco = await getCotacaoCripto(crypto.symbol);
    cotacoes.set(crypto.symbol, preco.toNumber());
  }

  const eventos: { date: string; symbol: string; quantity: Decimal }[] = [];

  cryptos.forEach(crypto => {
    crypto.investments.forEach(d =>
      eventos.push({
        date: d.date.toISOString().split('T')[0],
        symbol: crypto.symbol,
        quantity: new Decimal(d.quantity),
      })
    );
    crypto.sales.forEach(s =>
      eventos.push({
        date: s.date.toISOString().split('T')[0],
        symbol: crypto.symbol,
        quantity: new Decimal(s.quantity).neg(),
      })
    );
  });

  eventos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const saldos: Record<string, Record<string, Decimal>> = {};
  const acumulado: Record<string, Decimal> = {};

  for (const ev of eventos) {
    acumulado[ev.symbol] = (acumulado[ev.symbol] ?? new Decimal(0)).plus(ev.quantity);
    saldos[ev.date] = { ...acumulado };
  }

  const historico: { date: string; valorTotal: string }[] = [];

  for (const data in saldos) {
    const saldoDoDia = saldos[data];
    let total = new Decimal(0);
    for (const symbol in saldoDoDia) {
      const preco = cotacoes.get(symbol) ?? 0;
      total = total.plus(saldoDoDia[symbol].mul(preco));
    }
    historico.push({ date: data, valorTotal: total.toFixed(2) });
  }

  return historico;
};
