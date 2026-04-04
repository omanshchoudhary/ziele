export const notifications = [
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
];

export const getNotifications = () => {
  return notifications;
};
