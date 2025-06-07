import { calcularPortfolio } from '../services/portfolioService';

jest.mock('axios', () => ({
  get: (url: string) => {
    if (url.includes('cryptocompare')) {
      return Promise.resolve({ data: { USD: 30000 } }); // BTC
    }
    if (url.includes('awesomeapi')) {
      return Promise.resolve({ data: { USDBRL: { bid: '5.10' } } });
    }
    return Promise.resolve({ data: {} });
  }
}));

describe('calcularPortfolio', () => {
  it('deve retornar array de ativos com USD no topo', async () => {
    const portfolio = await calcularPortfolio();
    expect(Array.isArray(portfolio)).toBe(true);
    if (Array.isArray(portfolio)) {
      expect(portfolio[0].symbol).toBe('USD');
    } else {
      throw new Error('Portfolio is not an array');
    }
  });
});
