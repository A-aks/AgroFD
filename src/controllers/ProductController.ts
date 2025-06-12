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

export const getAllProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { state, city, market: marketId, category, lang = 'en', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, parseInt(limit as string) || 20);
    const skip = (pageNum - 1) * limitNum;
    const language = lang === 'hi' ? 'hi' : 'en';
    let availableMarkets: IMarket[] = [];
    console.log('Incoming query parameters:', { state, city, marketId, lang });

    // Market selection logic
    let selectedMarket: IMarket | null = null;

    if (marketId) {
      // If market ID is explicitly provided
      const isObjectId = mongoose.Types.ObjectId.isValid(marketId as string);
      const query = isObjectId
        ? { $or: [{ _id: marketId }, { id: marketId }] }
        : { id: marketId };

      selectedMarket = await Market.findOne(query).lean<IMarket>();

      if (!selectedMarket) {
        return res.status(400).json({
          success: false,
          error: 'Invalid market ID'
        });
      }
      const marketQuery: any = {};

      if (city) {
        marketQuery.$or = [
          { [`city.${language}`]: city },
          { [`city.en`]: { $regex: new RegExp(city as string, 'i') } },
          { [`city.hi`]: { $regex: new RegExp(city as string, 'i') } }
        ];
      }

      if (state) {
        marketQuery.$and = marketQuery.$and || [];
        marketQuery.$and.push({
          $or: [
            { [`state.${language}`]: state },
            { [`state.en`]: { $regex: new RegExp(state as string, 'i') } },
            { [`state.hi`]: { $regex: new RegExp(state as string, 'i') } }
          ]
        });
      }

      console.log('Market query:', JSON.stringify(marketQuery, null, 2));

      const matchingMarkets = await Market.find(marketQuery)
        .lean<IMarket[]>();

      console.log(`Found ${matchingMarkets.length} matching markets`);

      if (matchingMarkets.length > 0) {
        // Select first market by default when multiple exist
        selectedMarket = matchingMarkets[0];
        console.log(`Selected market: ${selectedMarket.id}`);
      }

      // Find all available markets for the response (without filtering)
      availableMarkets = await Market.find(marketQuery)
        .select('_id id name city state')
        .lean<IMarket[]>();

      console.log(`Total available markets: ${availableMarkets.length}`);

    } else {
      // When no market specified, get all markets matching city/state filters
      const marketQuery: any = {};

      if (city) {
        marketQuery.$or = [
          { [`city.${language}`]: city },
          { [`city.en`]: { $regex: new RegExp(city as string, 'i') } },
          { [`city.hi`]: { $regex: new RegExp(city as string, 'i') } }
        ];
      }

      if (state) {
        marketQuery.$and = marketQuery.$and || [];
        marketQuery.$and.push({
          $or: [
            { [`state.${language}`]: state },
            { [`state.en`]: { $regex: new RegExp(state as string, 'i') } },
            { [`state.hi`]: { $regex: new RegExp(state as string, 'i') } }
          ]
        });
      }

      console.log('Market query:', JSON.stringify(marketQuery, null, 2));

      const matchingMarkets = await Market.find(marketQuery)
        .lean<IMarket[]>();

      console.log(`Found ${matchingMarkets.length} matching markets`);

      if (matchingMarkets.length > 0) {
        // Select first market by default when multiple exist
        selectedMarket = matchingMarkets[0];
        console.log(`Selected market: ${selectedMarket.id}`);
      }

      // Find all available markets for the response (without filtering)
      availableMarkets = await Market.find(marketQuery)
        .select('_id id name city state')
        .lean<IMarket[]>();

      console.log(`Total available markets: ${availableMarkets.length}`);

    }
    // Product filtering
    const productFilter: any = {};
    if (category) productFilter.category = category;

    const [products, total] = await Promise.all([
      Product.find(productFilter).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(productFilter)
    ]);

    // Price aggregation if market is selected
    const priceMap = new Map<string, {
      price: number;
      available_stock: number;
      unit: string;
      date: Date;
    }>();

    if (selectedMarket) {
      const productIds = products.map(p => p._id.toString());
      const marketIdentifier = selectedMarket.id || selectedMarket._id.toString();

      const prices = await StockPrice.find({
        product_id: { $in: productIds },
        market: marketIdentifier
      })
        .sort({ date: -1 })
        .lean();

      console.log(`Found ${prices.length} price records for market ${marketIdentifier}`);

      prices.forEach(price => {
        const productId = price.product_id.toString();
        if (!priceMap.has(productId)) {
          priceMap.set(productId, {
            price: price.price,
            available_stock: price.available_stock,
            unit: price.unit,
            date: new Date(price.date)
          });
        }
      });
    }

    // Process products
    const productsWithPrices = products.map(product => {
      const productId = product._id.toString();
      const priceData = priceMap.get(productId);

      return {
        _id: productId,
        name: getLocalizedText(product.name, language),
        category: product.category || 'vegetables',
        image: product.image || '',
        createdAt: product.createdAt || new Date(0),
        price: priceData?.price ?? null,
        stock: priceData?.available_stock ?? null,
        unit: priceData?.unit ?? 'kg',
        priceUpdated: priceData?.date ?? null,
        market: selectedMarket ? selectedMarket.id || selectedMarket._id.toString() : null
      };
    });

    // Format response
    const allCategories = await Category.find().lean();

    const formattedCategories = allCategories.map(cat => ({
      id: cat._id,
      name: getLocalizedText(cat.name, language),
      // Include both language versions if needed
      // name_en: cat.name?.en,
      // name_hi: cat.name?.hi,
      // description: getLocalizedText(cat.description, language), in future we have need this property we can get access easly from here 
      category_img: cat.category_img
    }));

    // Format response
    const response = {
      success: true,
      data: {
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        items: productsWithPrices,
        selectedMarket: selectedMarket ? formatMarket(selectedMarket, language) : null,
        availableMarkets: availableMarkets.map((m: IMarket) => formatMarket(m, language)),
        filters: {
          appliedCategory: category || null,
          availableCategories:formattedCategories
        }
      }
    };

    return res.status(200).json(response);

  } catch (error: unknown) {
    console.error('Error in getAllProducts:', error);
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({
      success: false,
      error: err
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