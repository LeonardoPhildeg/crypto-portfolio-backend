import { calcularPrecoMedio } from '../utils/precoMedio';

describe('Função calcularPrecoMedio', () => {
  it('deve retornar 0 se não houver saldo', () => {
    const resultado = calcularPrecoMedio([], []);
    expect(resultado).toBe(0);
  });

  it('deve calcular corretamente com um aporte', () => {
    const resultado = calcularPrecoMedio([
      { id: 1, cryptoId: 1, date: new Date(), quantity: 2, totalUsdValue: 200, unitPriceUsd: 100 }
    ], []);
    expect(resultado).toBe(100);
  });

  it('deve calcular corretamente com múltiplos aportes e uma venda', () => {
    const resultado = calcularPrecoMedio([
      { id: 1, cryptoId: 1, date: new Date(), quantity: 1, totalUsdValue: 100, unitPriceUsd: 100 },
      { id: 2, cryptoId: 1, date: new Date(), quantity: 1, totalUsdValue: 200, unitPriceUsd: 200 }
    ], [
      { id: 1, cryptoId: 1, date: new Date(), quantity: 0.5, unitPriceUsd: 150 }
    ]);
    expect(resultado).toBeCloseTo(166.67, 1);
  });
});
