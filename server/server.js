import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { saveObservation, getObservations } from "./database.js";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());

app.get("/", (req, res) => {
  res.send("1ZZ server is running.");
});

app.get("/api/rate", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.exchangerate.dev/v1/latest/USD?symbols=INR"
    );

    if (!response.ok) {
      throw new Error(
        `ExchangeRate API returned ${response.status}`
      );
    }

    const data = await response.json();

    const rate = data.rates.INR;
    const timestamp = data.timestamp;

    saveObservation(timestamp, rate);

    res.json({
      pair: "USD/INR",
      rate,
      source: data.source,
      marketSession: data.market_session,
      dataUpdatedAt: data.data_updated_at,
      timestamp,
    });
  } catch (error) {
    console.error("FX API error:", error);

    res.status(500).json({
      error: "Unable to retrieve USD/INR data",
    });
  }
});

app.get("/api/history", (req, res) => {
  try {
    const observations = getObservations();

    res.json({
      observations,
    });
  } catch (error) {
    console.error("History error:", error);

    res.status(500).json({
      error: "Unable to retrieve historical data",
    });
  }
});

app.listen(PORT, () => {
  console.log(`1ZZ server running at http://localhost:${PORT}`);
});