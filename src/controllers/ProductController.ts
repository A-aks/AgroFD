import { Request, Response } from "express";
import Product from "../models/Product";
import Market from "../models/markets.models";
import StockPrice from '../models/StockPrice'


interface ProductResponse {
  _id: string;
  name: {
    en: string;
    hi: string;
  };
  category: string;
  image: string;
  createdAt: Date;
  price: number | null;
  stock: number | null;
  unit: string | null;
  priceUpdated: Date | null;
  market: string | null;
}

interface IMultilingualText {
  en: string;
  hi: string;
}

interface ProductResponse {
  _id: string;
  name: IMultilingualText;
  category: string;
  image: string;
  createdAt: Date;
  price: number | null;
  stock: number | null;
  unit: string | null;
  priceUpdated: Date | null;
  market: string | null;
}

interface LatestPrice {
  price?: number;
  available_stock?: number;
  unit?: string;
  date?: Date;
}

export const getAllProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { state, city, market, category, lang = 'en', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // 1. Market validation logic
    let selectedMarket = null;
    let availableMarkets: any[] = [];

    if (market) {
      // Verify market belongs to requested city/state
      const marketFilter: any = { id: market };
      if (state) marketFilter.state = state;
      if (city) marketFilter.city = city;

      selectedMarket = await Market.findOne(marketFilter);
      
      if (!selectedMarket) {
        // Try to find the market in wrong location
        const wrongLocationMarket = await Market.findOne({ id: market });
        if (wrongLocationMarket) {
          return res.status(400).json({
            success: false,
            error: `Market ${market} belongs to ${wrongLocationMarket.city}, ${wrongLocationMarket.state} (not ${city}, ${state})`
          });
        }
        return res.status(404).json({
          success: false,
          error: `Market with ID ${market} not found`
        });
      }
    } 
    else if (state && city) {
      // Find markets in specified city/state
      availableMarkets = await Market.find({ state, city }).sort({ name: 1 }).lean();
      if (availableMarkets.length > 0) {
        selectedMarket = availableMarkets[0];
      }
    }

    // 2. Build product query with optional category filter
    const productQuery: any = {};
    if (category) {
      productQuery.category = category;
    }

    // 3. Get products with prices
    const [products, total] = await Promise.all([
      Product.find(productQuery).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(productQuery)
    ]);

    let productsWithPrices: ProductResponse[] = [];

    if (selectedMarket) {
      const productIds = products.map(p => p._id);
      
      const latestPrices = await StockPrice.aggregate<{
        _id: string;
        latestPrice: LatestPrice;
      }>([
        {
          $match: {
            product_id: { $in: productIds },
            market: selectedMarket.id
          }
        },
        { $sort: { product_id: 1, date: -1 } },
        {
          $group: {
            _id: "$product_id",
            latestPrice: { $first: "$$ROOT" }
          }
        }
      ]);

      const priceMap = new Map<string, LatestPrice>(
        latestPrices.map(price => [price._id, price.latestPrice])
      );

      productsWithPrices = products.map(product => ({
        _id: product._id,
        name: {
          en: product.name?.en ?? "",
          hi: product.name?.hi ?? ""
        },
        category: product.category,
        image: product.image,
        createdAt: product.createdAt ?? new Date(0),
        price: priceMap.get(product._id)?.price || null,
        stock: priceMap.get(product._id)?.available_stock || null,
        unit: priceMap.get(product._id)?.unit || null,
        priceUpdated: priceMap.get(product._id)?.date || null,
        market: selectedMarket?.id || null
      }));
    } else {
      productsWithPrices = products.map(product => ({
        _id: product._id,
        name: {
          en: product.name?.en ?? "",
          hi: product.name?.hi ?? ""
        },
        category: product.category,
        image: product.image,
        createdAt: product.createdAt ?? new Date(0),
        price: null,
        stock: null,
        unit: null,
        priceUpdated: null,
        market: null
      }));
    }

    // 4. Format response
    const response = {
      success: true,
      data: {
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        items: productsWithPrices,
        selectedMarket: selectedMarket ? {
          id: selectedMarket.id,
          name: selectedMarket.name,
          address: selectedMarket.address,
          city: selectedMarket.city,
          state: selectedMarket.state
        } : null,
        availableMarkets: availableMarkets.map(m => ({
          id: m.id,
          name: m.name,
          city: m.city,
          state: m.state
        })),
        filters: {
          appliedCategory: category || null,
          availableCategories: await Product.distinct('category')
        }
      }
    };

    return res.status(200).json(response);

  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      success: false,
      error: err
    });
  }
};

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const filter = category ? { category } : {};

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ category: 1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    if (!products.length) {
      res.status(404).json({
        message: category
          ? `No products found in category "${category}"`
          : "No products found",
      });
      return;
    }

    res.status(200).json({
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      items: products,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};



