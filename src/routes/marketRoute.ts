import express from 'express';
import {
  createMarket,
  getAllMarkets,
  getMarketsByLocation,
  getMarketById,
  updateMarket,
  deleteMarket
} from '../controllers/Market_controller';

const router = express.Router();

router.post('/', createMarket);
router.get('/', getAllMarkets);
router.get('/nearby', getMarketsByLocation);
router.get('/:id', getMarketById);
router.put('/:id', updateMarket);
router.delete('/:id', deleteMarket);

export default router;