const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");
const authRoutes = require("./routes/auth");
const medicalRoutes = require("./routes/medical");

dotenv.config();
const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/medical", medicalRoutes);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
