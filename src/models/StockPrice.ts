import mongoose, { Document, Schema } from 'mongoose';

export interface IStockPrice extends Document {
  id: string;
  product_id: string;
  date: Date;
  market: string;
  unit: string;
  price: number;
  available_stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const StockPriceSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  product_id: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  market: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'ton', 'quintal', 'bag','liter'],
    default: 'kg'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  available_stock: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound indexes for common query patterns
StockPriceSchema.index({ product_id: 1, market: 1 });
StockPriceSchema.index({ market: 1, date: 1 });
StockPriceSchema.index({ product_id: 1, date: 1 });

// Pre-save hook for data validation
StockPriceSchema.pre<IStockPrice>('save', function(next) {
  // Ensure price and stock are positive numbers
  if (this.price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (this.available_stock < 0) {
    throw new Error('Available stock cannot be negative');
  }
  next();
});

export default mongoose.model<IStockPrice>('StockPrice', StockPriceSchema);