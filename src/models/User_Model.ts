import mongoose, { Schema, Document } from "mongoose";

// Define an interface for the User document
export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const userSchema: Schema<IUser> = new Schema(
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
        phone: {
            type: String,
            required: [true, "Please add User Mobile Number"],
        },
        password: {
            type: String,
            required: [true, "Please add Password"],
        },
    },
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt`
    }
);

// Export the model with IUser type
export default mongoose.model<IUser>("contacts", userSchema);
