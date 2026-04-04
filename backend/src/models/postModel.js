export const posts = [
  { id: 1, title: 'Welcome to Ziele', content: 'This is your first post!', author: 'Admin', createdAt: new Date() },
  { id: 2, title: 'Getting Started', content: 'Start writing your blogs here.', author: 'Admin', createdAt: new Date() }
];

export const getPosts = () => {
  return posts;
};

export const getPostById = (id) => {
  // Mock returns a default sample post regardless of the specific ID, as per previous implementation
  return { id, title: 'Sample Post', content: 'This is a sample post content.', author: 'Admin' };
};
