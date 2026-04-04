import { getNotifications } from '../models/notificationModel.js';

export const getAllNotifications = (req, res) => {
  try {
    const notifications = getNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
