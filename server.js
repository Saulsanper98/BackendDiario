require('dotenv').config();
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origen no permitido por CORS."));
    },
    credentials: true
  })
);

app.use(express.json());

app.use("/api/notes", require("./routes/notes"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/postit", require("./routes/postit"));
app.use("/api/docs", require("./routes/docs"));
app.use("/api/handovers", require("./routes/handovers"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/users", require("./routes/users"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
