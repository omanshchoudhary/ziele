import { getDiscoverData, getSidebarData } from '../models/metaModel.js';

export const getSidebar = async (req, res) => {
  try {
    res.json(await getSidebarData());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sidebar data' });
  }
};

export const getDiscover = async (req, res) => {
  try {
    res.json(await getDiscoverData(req.query || {}));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discover data' });
  }
};
