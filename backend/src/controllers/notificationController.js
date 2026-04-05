import { getNotifications } from '../models/notificationModel.js';

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await getNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
