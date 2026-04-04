const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/posts', (req, res) => {
  res.json([
    { id: 1, title: 'Welcome to Ziele', content: 'This is your first post!', author: 'Admin', createdAt: new Date() },
    { id: 2, title: 'Getting Started', content: 'Start writing your blogs here.', author: 'Admin', createdAt: new Date() }
  ]);
});

app.get('/api/posts/:id', (req, res) => {
  res.json({ id: req.params.id, title: 'Sample Post', content: 'This is a sample post content.', author: 'Admin' });
});

app.get('/api/notifications', (req, res) => {
  res.json([
    { 
      id: 1, 
      type: 'follow', 
      user: { name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?u=alex' }, 
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      read: false 
    },
    { 
      id: 2, 
      type: 'comment', 
      user: { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah' }, 
      target: 'The Future of AI in Blogging',
      content: 'Great insights! I really loved the part about tRPC.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false 
    },
    { 
      id: 3, 
      type: 'like', 
      user: { name: 'Jordan Smith', avatar: 'https://i.pravatar.cc/150?u=jordan' }, 
      target: 'Building with Socket.io',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true 
    },
    { 
      id: 4, 
      type: 'follow', 
      user: { name: 'Taylor Swift', avatar: 'https://i.pravatar.cc/150?u=taylor' }, 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: true 
    }
  ]);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});