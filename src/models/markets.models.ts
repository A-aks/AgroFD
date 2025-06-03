import mongoose, { Document, Schema } from 'mongoose';

export interface IMarket extends Document {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  contact: string;
  operating_hours: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const MarketSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  state: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    default: '',
    trim: true
  },
  operating_hours: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add 2dsphere index for geospatial queries
MarketSchema.index({ location: '2dsphere' });

// Add compound indexes for faster state/city queries
MarketSchema.index({ state: 1, city: 1 });

// Pre-save hook to ensure proper formatting
MarketSchema.pre<IMarket>('save', function(next) {
  this.updatedAt = new Date();
  this.name = this.name.trim();
  this.city = this.city.trim();
  this.state = this.state.trim();
  this.address = this.address.trim();
  this.contact = this.contact.trim();
  this.operating_hours = this.operating_hours.trim();
  next();
});

export default mongoose.model<IMarket>('Market', MarketSchema);