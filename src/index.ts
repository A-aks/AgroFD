import express, { Application } from "express";
import errorHandler from "./middleware/errorHandler";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./Config/db_connection"; // Import DB connection
import userRoutes from "./routes/userroutes";
import authRoutes from "./routes/authRoutes";
import product_category from "./routes/productCategoryRoutes";
import translationRoutes from "./routes/translationRoutes";

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/product", product_category);
app.use("/api/translations", translationRoutes);
app.use(errorHandler);

// ✅ Ensure DB Connection Before Starting Server
const startServer = async () => {
  try {
    await connectDb(); // Wait for DB connection
    app.listen(port, () => {
      console.log(`🚀 Server running on Port: ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
