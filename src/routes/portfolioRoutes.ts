import express from 'express';
import {
  getPortfolio,
  getTransactionHistory,
  exportToJson,
  exportToCsv,
  consultarEvolucao
} from '../controllers/portfolioController';

const router = express.Router();

router.get('/', getPortfolio);
router.get('/history/:symbol', getTransactionHistory);
router.get('/export', exportToJson);
router.get('/export/csv', exportToCsv);
router.get("/evolucao", consultarEvolucao);

export default router;
