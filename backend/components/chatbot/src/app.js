import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use(errorHandler);
export default app;