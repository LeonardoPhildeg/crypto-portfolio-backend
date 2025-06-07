import { Decimal } from '@prisma/client/runtime/library';
import { Investment, Sale } from '@prisma/client';

export function calcularPrecoMedio(investments: Investment[], sales: Sale[]): Decimal {
  const totalComprado = investments.reduce((sum, d) => sum.plus(d.quantity), new Decimal(0));
  const totalVendido = sales.reduce((sum, s) => sum.plus(s.quantity), new Decimal(0));
  const saldo = totalComprado.minus(totalVendido);

  if (saldo.lte(0)) return new Decimal(0);

  // Inicia o valor total investido restante com 0
  let totalInvestidoRestante = new Decimal(0);
  let saldoRestante = saldo;

  // Percorre investimentos de forma reversa (últimos primeiro)
  for (const d of [...investments].reverse()) {
    const quantidade = new Decimal(d.quantity);
    const preco = new Decimal(d.unitPriceUsd);

    const quantidadeUsada = Decimal.min(quantidade, saldoRestante);
    totalInvestidoRestante = totalInvestidoRestante.plus(quantidadeUsada.times(preco));

    saldoRestante = saldoRestante.minus(quantidadeUsada);
    if (saldoRestante.lte(0)) break;
  }

  // Preço médio com duas casas decimais
  return totalInvestidoRestante.div(saldo).toDecimalPlaces(2);
}
