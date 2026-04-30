import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './utils/prisma';
import authRoutes from './routes/auth';
import itemsRoutes from './routes/items';
import suppliersRoutes from './routes/suppliers';
import prRoutes from './routes/pr';
import poRoutes from './routes/po';
import receivingRoutes from './routes/receiving';
import inventoryRoutes from './routes/inventory';
import apRoutes from './routes/ap';
import vouchersRoutes from './routes/vouchers';
import disbursementRoutes from './routes/disbursement';
import discrepancyRoutes from './routes/discrepancy';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
});

// Store io instance in app to use in controllers
app.set('io', io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/pr', prRoutes);
apiRouter.use('/po', poRoutes);
apiRouter.use('/items', itemsRoutes);
apiRouter.use('/suppliers', suppliersRoutes);
apiRouter.use('/receiving', receivingRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/ap', apRoutes);
apiRouter.use('/vouchers', vouchersRoutes);
apiRouter.use('/disbursement', disbursementRoutes);
apiRouter.use('/discrepancies', discrepancyRoutes);
// apiRouter.use('/reports', reportRoutes);

app.use('/api/v1', apiRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});
