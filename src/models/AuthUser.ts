import mongoose, { Document, Schema, Model } from "mongoose";

// Define the user roles as a TypeScript Enum
enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
  FARMER = "farmer",
  BUSINESS = "business",
  DELIVERY_PARTNER = "delivery-partner",
}

// Define the TypeScript interface for the User document
interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  address?: string;
  city?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the Mongoose Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add User Name"],
    },
    email: {
      type: String,
      required: [true, "Please add User Email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add Password"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    address: {
      type: String,
      required: [true, "Add your address"],
    },
    city: {
      type: String,
      required: [true, "Please add city"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
  }
);

// Define and export the Mongoose model
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
