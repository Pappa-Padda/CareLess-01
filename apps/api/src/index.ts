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

const app = express();
// PORT is automatically set by Render to 10000 or from environment variable
// API_PORT will be used for local development
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PORT = process.env.API_PORT;

app.use(cors({
  origin: ['http://localhost:3000', 'https://care-less-prod.vercel.app'], 
  credentials: true,
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
app.use('/allocation', allocationRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${API_URL}`);
});