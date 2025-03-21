import express, { Application } from "express";  // ✅ Correctly import express
import errorHandler from "./middleware/errorHandler";
import connectDb from "./Config/db_connection";
import cors from "cors";
import dotenv from "dotenv";
// Use `import` instead of `require` for routes in TypeScript
import userRoutes from "./routes/userroutes";
import authRoutes from "./routes/authRoutes";
import product_category from './routes/productCategoryRoutes'

dotenv.config();

const app: Application = express(); // ✅ Now express is properly imported
const port = process.env.PORT || 5000;

connectDb();
app.use(cors());
app.use(express.json());



app.use("/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/product",product_category);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server running on Port: ${port}`);
});
