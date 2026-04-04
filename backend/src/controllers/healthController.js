export const checkHealth = (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running via MVC architecture' });
};
