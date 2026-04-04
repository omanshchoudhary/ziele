import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import postRoutes from './routes/postRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import metaRoutes from './routes/metaRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Main logical routes
app.use('/api/health', healthRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/meta', metaRoutes);

export default app;
