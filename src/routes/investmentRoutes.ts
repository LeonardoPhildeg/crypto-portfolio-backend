import express from 'express';
import { createInvestment } from '../controllers/investmentController';

const router = express.Router();
router.post('/', createInvestment);
export default router;
