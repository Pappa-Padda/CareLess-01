import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 4000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// Routes
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on ${API_URL}`);
});