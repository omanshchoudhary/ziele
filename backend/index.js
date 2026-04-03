const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 0;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/posts', (req, res) => {
  res.json([
    { id: 1, title: 'Welcome to InkFlow', content: 'This is your first post!', author: 'Admin', createdAt: new Date() },
    { id: 2, title: 'Getting Started', content: 'Start writing your blogs here.', author: 'Admin', createdAt: new Date() }
  ]);
});

app.get('/api/posts/:id', (req, res) => {
  res.json({ id: req.params.id, title: 'Sample Post', content: 'This is a sample post content.', author: 'Admin' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});