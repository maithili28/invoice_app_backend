import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, { dbName: "devops_monitor" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

// simple route
app.get("/", (req, res) => {
  res.send("DevOps Monitoring Backend is running!");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
