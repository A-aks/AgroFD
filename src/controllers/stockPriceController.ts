import { Request, Response } from 'express';
import StockPrice, { IStockPrice } from '../models/StockPrice';

interface StockPriceQuery {
  product_id?: string;
  market?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export const createStockPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const stockPriceData: IStockPrice = req.body;
    const newStockPrice = new StockPrice(stockPriceData);
    const savedStockPrice = await newStockPrice.save();
    res.status(201).json({
      success: true,
      data: savedStockPrice
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(400).json({
      success: false,
      error: err
    });
  }
};

export const getStockPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, market, start_date, end_date, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: StockPriceQuery = {};

    if (product_id) query.product_id = product_id as string;
    if (market) query.market = market as string;
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date as string);
      if (end_date) query.date.$lte = new Date(end_date as string);
    }

    const [stockPrices, total] = await Promise.all([
      StockPrice.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 }), // Newest first
      StockPrice.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: stockPrices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: err
    });
  }
};

export const getStockPriceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const stockPrice = await StockPrice.findOne({ id: req.params.id });
    if (!stockPrice) {
      res.status(404).json({
        success: false,
        message: 'Stock price not found'
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: stockPrice
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: err
    });
  }
};

export const updateStockPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedStockPrice = await StockPrice.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedStockPrice) {
      res.status(404).json({
        success: false,
        message: 'Stock price not found'
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: updatedStockPrice
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(400).json({
      success: false,
      error: err
    });
  }
};

export const deleteStockPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedStockPrice = await StockPrice.findOneAndDelete({ id: req.params.id });
    if (!deletedStockPrice) {
      res.status(404).json({
        success: false,
        message: 'Stock price not found'
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Stock price deleted successfully'
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: err
    });
  }
};

// Get latest prices for all products in a market
export const getLatestMarketPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { market } = req.params;
    
    const latestPrices = await StockPrice.aggregate([
      { $match: { market } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$product_id",
          latestPrice: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestPrice" } }
    ]);

    res.status(200).json({
      success: true,
      data: latestPrices
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: err
    });
  }
};