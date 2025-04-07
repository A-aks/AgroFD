import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Define User Roles
export enum UserRole {
  ADMIN = "admin",
  MARKETING = "marketing",
  SALES = "sales",
  BUSINESS = "business",
  FARMER = "farmer",
  DELIVERY_AGENT = "deliveryAgent",
  CUSTOMER = "customer",
}

// Define Business Types (Only for BUSINESS users)
export enum BusinessType {
  SELLER = "seller",
  SHOP = "shop",
  READY_SELLER = "readySeller",
  RESTAURANT = "restaurant",
  HOTEL = "hotel",
  HOSPITAL = "hospital",
  CANTEEN = "canteen",
}

// Define KYC details interface
interface IKYC {
  documentType: string;
  documentNumber: string;
  documentImage: string;
  isVerified: boolean;
}

// Define Bank details interface
interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
}

// Define Business details interface (only for Business users)
interface IBusinessDetails {
  businessName: string;
  businessType: BusinessType;
  businessRegistrationNumber?: string;
  gstNumber?: string;
  businessAddress?: string;
}

// Define Farming details interface (only for Farmers)
interface IFarmingDetails {
  crops: {
    cropType: string;
    productionSize: string;
  }[];
  landSize: string;
  experienceYears: number;
  certifications?: string[];
}

// Define Delivery Agent details interface
interface IDeliveryDetails {
  vehicleType: string;
  vehicleNumber: string;
  drivingLicenseNumber: string;
}

// Define the User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  altPhone?: string;
  address?: string;
  city?: string;
  avatar?: string;
  isDisabled?: boolean;
  kyc?: IKYC;
  bankAccount?: IBankAccount;
  businessDetails?: IBusinessDetails;
  farmingDetails?: IFarmingDetails;
  deliveryDetails?: IDeliveryDetails;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    phone: { type: String, required: true, unique: true },
    altPhone: { type: String },
    address: { type: String },
    city: { type: String },
    avatar: { type: String },
    isDisabled: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // ✅ Track Creator
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }, // ✅ Track Updater
    kyc: {
      documentType: { type: String },
      documentNumber: { type: String, unique: true },
      documentImage: { type: String },
      isVerified: { type: Boolean, default: false },
    },
    bankAccount: {
      accountHolderName: { type: String },
      accountNumber: { type: String, unique: true },
      bankName: { type: String },
      ifscCode: { type: String },
      branchName: { type: String },
    },
    businessDetails: {
      businessName: { type: String },
      businessType: { type: String, enum: Object.values(BusinessType) },
      businessRegistrationNumber: { type: String },
      gstNumber: { type: String },
      businessAddress: { type: String },
    },
    farmingDetails: {
      crops: [
        {
          cropType: { type: String, required: true },
          productionSize: { type: String, required: true },
        },
      ],
      landSize: { type: String, required: true },
      experienceYears: { type: Number, required: true },
      certifications: [{ type: String }],
    },
    deliveryDetails: {
      vehicleType: { type: String },
      vehicleNumber: { type: String },
      drivingLicenseNumber: { type: String },
    },
  },
  { timestamps: true }
);

// Define the UserHistory interface
export interface IUserHistory extends Document {
  userId: Types.ObjectId; // ✅ User whose data was changed
  updatedBy: Types.ObjectId; // ✅ Admin/User who made the update
  timestamp: Date;
  changes: Record<string, { oldValue: any; newValue: any }>; // ✅ Tracks field-level changes
}

// Define the UserHistory Schema
const UserHistorySchema: Schema<IUserHistory> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    timestamp: { type: Date, default: Date.now },
    changes: { type: Map, of: Object, required: true },
  },
  { timestamps: true }
);

// Export Models
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
const UserHistory: Model<IUserHistory> = mongoose.model<IUserHistory>(
  "UserHistory",
  UserHistorySchema
);

export { User, UserHistory };
