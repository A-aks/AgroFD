import { Request, Response } from 'express';
import Market, { IMarket } from '../models/markets.models';

// Define a custom error interface
interface ErrorWithMessage {
  message: string;
}

// Type guard to check if error has message property
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Helper function to convert unknown error to ErrorWithMessage
function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // Fallback in case there's an error stringifying the maybeError
    return new Error(String(maybeError));
  }
}

export const createMarket = async (req: Request, res: Response): Promise<void> => {
  try {
    const marketData: IMarket = req.body;
    const newMarket = new Market(marketData);
    const savedMarket = await newMarket.save();
    res.status(201).json(savedMarket);
  } catch (error) {
    const err = toErrorWithMessage(error);
    res.status(400).json({ error: err.message });
  }
};

export const getAllMarkets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, city, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    
    if (state) query.state = state as string;
    if (city) query.city = city as string;
    if (search) query.name = { $regex: search as string, $options: 'i' };

    const [markets, total] = await Promise.all([
      Market.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ state: 1, city: 1, name: 1 }),
      Market.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: markets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    const err = toErrorWithMessage(error);
    res.status(500).json({ error: err.message });
  }
};

export const getMarketsByLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;
    
    if (!longitude || !latitude) {
      res.status(400).json({ error: 'Longitude and latitude are required' });
      return;
    }

    const markets = await Market.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)]
          },
          $maxDistance: Number(maxDistance)
        }
      }
    }).limit(20);

    res.status(200).json({ success: true, data: markets });
  } catch (error) {
    const err = toErrorWithMessage(error);
    res.status(500).json({ error: err.message });
  }
};

export const getMarketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const market = await Market.findOne({ id: req.params.id });
    if (!market) {
      res.status(404).json({ error: 'Market not found' });
      return;
    }
    res.status(200).json(market);
  } catch (error) {
    const err = toErrorWithMessage(error);
    res.status(500).json({ error: err.message });
  }
};

export const updateMarket = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedMarket = await Market.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMarket) {
      res.status(404).json({ error: 'Market not found' });
      return;
    }
    res.status(200).json(updatedMarket);
  } catch (error) {
    const err = toErrorWithMessage(error);
    res.status(400).json({ error: err.message });
  }
};

export const deleteMarket = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedMarket = await Market.findOneAndDelete({ id: req.params.id });
    if (!deletedMarket) {
      res.status(404).json({ error: 'Market not found' });
      return;
    }
    res.status(200).json({ message: 'Market deleted successfully' });
  } catch (error) {
    const err = toErrorWithMessage(error);
    res.status(500).json({ error: err.message });
  }
};