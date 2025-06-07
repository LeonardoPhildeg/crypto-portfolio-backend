import express from 'express';
import investmentRoutes from './routes/investmentRoutes';
import saleRoutes from './routes/saleRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import cashRoutes from "./routes/cashRoutes";
import cors from "cors";


const app = express();

// Configuração do CORS para permitir requisições do frontend
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.get('/', (req, res) => res.send('API de Criptoativos ativa!'));

app.use('/investments', investmentRoutes);
app.use('/sales', saleRoutes);
app.use('/portfolio', portfolioRoutes);
app.use("/cash", cashRoutes);

export default app;
