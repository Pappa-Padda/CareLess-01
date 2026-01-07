import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes'; 
import groupRoutes from './routes/groupRoutes';
import carRoutes from './routes/carRoutes';
import liftRequestRoutes from './routes/liftRequestRoutes';
import liftOfferRoutes from './routes/liftOfferRoutes';
import passengerRoutes from './routes/passengerRoutes';
import allocationRoutes from './routes/allocationRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
// PORT is automatically set by Render to 10000 or from environment variable
// API_PORT will be used for local development
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PORT = process.env.API_PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL;

console.log('CORS Configuration:');
console.log('- FRONTEND_URL:', FRONTEND_URL);

const allowedOrigins = ['http://localhost:3000', 'https://care-less-prod.vercel.app'];
if (FRONTEND_URL) {
  allowedOrigins.push(FRONTEND_URL.replace(/\/$/, "")); 
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                     origin.endsWith('.vercel.app') ||
                     (FRONTEND_URL && origin.startsWith(FRONTEND_URL.replace(/\/$/, "")));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin ${origin} not allowed. Allowed list: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/events', eventRoutes); 
app.use('/groups', groupRoutes);
app.use('/cars', carRoutes);
app.use('/lift-requests', liftRequestRoutes);
app.use('/lift-offers', liftOfferRoutes);
app.use('/passenger', passengerRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.get('/', (req, res) => {
  res.send('API is running');
});
app.use('/allocation', allocationRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${API_URL}`);
});