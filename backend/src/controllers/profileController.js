import { getProfileById, getProfiles } from '../models/profileModel.js';

export const getAllProfiles = (req, res) => {
  try {
    res.json(getProfiles());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

export const getProfile = (req, res) => {
  try {
    const profile = getProfileById(req.params.id || 'omansh');
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getCurrentProfile = (req, res) => {
  try {
    const profile = getProfileById('omansh');
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current profile' });
  }
};
