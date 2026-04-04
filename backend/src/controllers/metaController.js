import { getDiscoverData, getSidebarData } from '../models/metaModel.js';

export const getSidebar = (req, res) => {
  try {
    res.json(getSidebarData());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sidebar data' });
  }
};

export const getDiscover = (req, res) => {
  try {
    res.json(getDiscoverData(req.query || {}));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discover data' });
  }
};
