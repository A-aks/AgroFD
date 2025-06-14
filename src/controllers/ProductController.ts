import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import Market from "../models/markets.models";
import StockPrice from '../models/StockPrice';
import { Category } from '../models/Category'; // Adjust path as needed

// Types
export interface IMultilingualText {
  en?: string;
  hi?: string;
  [key: string]: string | undefined;
}

interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: IMultilingualText | string;
  category: string;
  image?: string;
  createdAt?: Date;
}

interface IMarket {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: IMultilingualText;
  city?: IMultilingualText;
  state?: IMultilingualText;
  address?: IMultilingualText;
}

interface ILatestPrice {
  price: number;
  available_stock: number;
  unit: string;
  date: Date;
}

interface IProductResponse {
  _id: string;
  name: string;
  category: string;
  image: string;
  createdAt: Date;
  price: number | null;
  stock: number | null;
  unit: string | null;
  priceUpdated: Date | null;
  market: string | null;
}

interface IMarketResponse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface IFilterOptions {
  state?: string;
  city?: string;
  market?: string;
  category?: string;
  lang?: string;
  page?: string;
  limit?: string;
}

// Constants
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'hi'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    // 1. Parse query params with defaults
    const { 
      state: stateParam, 
      city: cityParam, 
      market: marketId, 
      category, 
      lang , 
      page = 1, 
      limit = 20 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;
    const language = lang === 'hi' ? 'hi' : 'en';

    // 2. Get user's location (from auth middleware)
    const user = (req as any).user; // Assuming user is attached by auth middleware
    const defaultState = user?.state || stateParam;
    const defaultCity = user?.city || cityParam;

    // 3. Get filterable locations
    const [allStates, filteredCities] = await Promise.all([
      // All states in system
      Market.distinct(`state.${language}`),
      // Cities filtered by selected state (or user's default state)
      defaultState 
        ? Market.distinct(`city.${language}`, { 
            $or: [
              { [`state.${language}`]: defaultState },
              { 'state.en': { $regex: new RegExp(defaultState as string, 'i') } },
              { 'state.hi': { $regex: new RegExp(defaultState as string, 'i') } }
            ]
          })
        : Market.distinct(`city.${language}`)
    ]);

    // 4. Build market query
    const marketQuery: any = {};
    
    // State filter (user's state or selected state)
    if (defaultState) {
      marketQuery.$or = [
        { [`state.${language}`]: defaultState },
        { 'state.en': { $regex: new RegExp(defaultState as string, 'i') } },
        { 'state.hi': { $regex: new RegExp(defaultState as string, 'i') } }
      ];
    }

    // City filter (user's city or selected city)
    if (defaultCity) {
      marketQuery.$or = (marketQuery.$or || []).concat([
        { [`city.${language}`]: defaultCity },
        { 'city.en': { $regex: new RegExp(defaultCity as string, 'i') } },
        { 'city.hi': { $regex: new RegExp(defaultCity as string, 'i') } }
      ]);
    }

    // 5. Handle explicit market selection
    let selectedMarket: IMarket | null = null;
    if (marketId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(marketId as string);
      const query = isObjectId 
        ? { $or: [{ _id: marketId }, { id: marketId }] } 
        : { id: marketId };
      
      selectedMarket = await Market.findOne(query).lean() as any as IMarket;
      if (!selectedMarket) {
        return res.status(400).json({ success: false, error: 'Market not found' });
      }
    }

    // 6. Get available markets
    const availableMarkets = await Market.find(marketQuery)
      .select('_id id name city state')
      .lean();

    // Set default market if none selected
    if (!selectedMarket && availableMarkets.length > 0) {
      selectedMarket = availableMarkets[0] as unknown as IMarket;
    }

    // 7. Get products with prices
    const productFilter = category ? { category } : {};
    const [products, total] = await Promise.all([
      Product.find(productFilter).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(productFilter)
    ]);

    // 8. Get latest prices for selected market
    const priceMap = new Map();
    if (selectedMarket) {
      const marketId = selectedMarket.id || selectedMarket._id.toString();
      const prices = await StockPrice.find({
        product_id: { $in: products.map(p => p._id) },
        market: marketId
      }).sort({ date: -1 }).lean();

      prices.forEach(price => {
        if (!priceMap.has(price.product_id.toString())) {
          priceMap.set(price.product_id.toString(), {
            price: price.price,
            stock: price.available_stock,
            unit: price.unit,
            updatedAt: price.date
          });
        }
      });
    }

    // 9. Format products with prices
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: getLocalizedText(product.name, language),
      category: product.category,
      image: product.image,
      price: priceMap.get(product._id.toString())?.price || null,
      stock: priceMap.get(product._id.toString())?.stock || null,
      unit: priceMap.get(product._id.toString())?.unit || 'kg',
      priceUpdated: priceMap.get(product._id.toString())?.updatedAt || null,
      market: selectedMarket?.id || null
    }));

    // 10. Get categories
    const categories = await Category.find().lean();
    const formattedCategories = categories.map(cat => ({
      id: cat._id,
      name: getLocalizedText(cat.name, language),
      name_en: cat.name?.en,
      name_hi: cat.name?.hi,
      category_img: cat.category_img
    }));

    // 11. Final response
    res.json({
      success: true,
      data: {
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        items: formattedProducts,
        selectedMarket: selectedMarket ? {
          id: selectedMarket.id || selectedMarket._id.toString(),
          name: getLocalizedText(selectedMarket.name, language),
          city: getLocalizedText(selectedMarket.city, language),
          state: getLocalizedText(selectedMarket.state, language)
        } : null,
        availableMarkets: availableMarkets.map(market => ({
          id: market.id || market._id.toString(),
          name: getLocalizedText(market.name, language),
          city: getLocalizedText(market.city, language),
          state: getLocalizedText(market.state, language)
        })),
        filters: {
          appliedState: defaultState || null,
          appliedCity: defaultCity || null,
          availableStates: allStates.filter(Boolean).map(s => ({
            id: (typeof s === 'string' ? s : String(s)).toLowerCase().replace(/\s+/g, '-'),
            name: typeof s === 'string' ? s : String(s)
          })),
          availableCities: filteredCities.filter(Boolean).map(c => ({
            id: (c as string).toLowerCase().replace(/\s+/g, '-'),
            name: c as string
          })),
          availableMarkets: availableMarkets.map(market => ({
            id: market.id || market._id.toString(),
            name: getLocalizedText(market.name, language),
            city: getLocalizedText(market.city, language),
            state: getLocalizedText(market.state, language)
          })),
          availableCategories: formattedCategories
        }
      }
    });
  } catch (error) {
    console.error('Market controller error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error'
    });
  }
};

// Updated helper functions with proper typing
function getLocalizedText(
  text: IMultilingualText | string | undefined,
  language: string
): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[language as keyof IMultilingualText] || text.en || '';
}

function formatMarket(
  market: IMarket,
  language: string
): { id: string; name: string; address?: string; city?: string; state?: string } {
  return {
    id: market.id || market._id.toString(),
    name: getLocalizedText(market.name, language),
    address: market.address ? getLocalizedText(market.address, language) : undefined,
    city: market.city ? getLocalizedText(market.city, language) : undefined,
    state: market.state ? getLocalizedText(market.state, language) : undefined
  };
}
// Other controller functions
export const getProductsByCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const category = req.query.category as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, parseInt(req.query.limit as string) || DEFAULT_LIMIT);
    const skip = (page - 1) * limit;

    const filter = category ? {
      category: { $regex: new RegExp(category, 'i') }
    } : {};

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ category: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      Product.countDocuments(filter)
    ]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: category
          ? `No products found in category "${category}"`
          : "No products found",
      });
    }

    const response = {
      success: true,
      data: {
        page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        items: products.map(product => ({
          _id: product._id.toString(),
          name: getLocalizedText(product.name, DEFAULT_LANGUAGE),
          category: product.category || 'uncategorized',
          image: product.image || 'https://example.com/default-product.png',
          createdAt: product.createdAt || new Date()
        }))
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error fetching products by category:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllProductCategories = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categories = await Product.distinct('category');

    return res.status(200).json({
      success: true,
      data: {
        count: categories.length,
        categories: categories.map(category => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
        }))
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch product categories',
      details: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : 'Unknown error')
        : undefined
    });
  }
};