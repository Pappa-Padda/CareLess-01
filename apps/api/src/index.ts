import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
// PORT is automatically set by Render to 10000 or from environment variable
// API_PORT will be used for local development
const PORT = process.env.PORT || process.env.API_PORT;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

app.use(cors({
  origin: ['http://localhost:3000', 'https://care-less-prod.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on ${API_URL}`);
});