import express from 'express';
import {
  createStockPrice,
  getStockPrices,
  getStockPriceById,
  updateStockPrice,
  deleteStockPrice,
  getLatestMarketPrices
} from '../controllers/stockPriceController';

const router = express.Router();

// CRUD operations
router.post('/', createStockPrice);
router.get('/', getStockPrices);
router.get('/:id', getStockPriceById);
router.put('/:id', updateStockPrice);
router.delete('/:id', deleteStockPrice);

// Special endpoints
router.get('/market/:market/latest', getLatestMarketPrices);

export default router;