import mongoose, { Document, Schema, Model } from "mongoose";

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
  createdAt?: Date;
  updatedAt?: Date;
}

// Define User Schema
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
    },
  },
  { timestamps: true }
);

// Export the User Model
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export { User };
