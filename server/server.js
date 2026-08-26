import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3001;

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  next();
});

// --------------------------------------------------
// PATH SETUP
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const historyPath = path.join(
  __dirname,
  "..",
  "data",
  "DEXINUS.csv"
);

// --------------------------------------------------
// ROOT
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("1ZZ server is running.");
});

// --------------------------------------------------
// LIVE USD / INR
// --------------------------------------------------

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

    const rate = data?.rates?.INR;

    if (typeof rate !== "number") {
      throw new Error(
        "INR rate missing from API response"
      );
    }

    res.json({
      pair: "USD/INR",
      rate,
      source: "live",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Live rate error:", error);

    res.status(500).json({
      error: "Unable to retrieve USD/INR data"
    });
  }
});

// --------------------------------------------------
// HISTORICAL USD / INR — FRED
// --------------------------------------------------

app.get("/api/history", (req, res) => {
  try {
    if (!fs.existsSync(historyPath)) {
      return res.status(404).json({
        error: "DEXINUS.csv not found"
      });
    }

    const csv = fs.readFileSync(
      historyPath,
      "utf8"
    );

    const lines = csv
      .trim()
      .split(/\r?\n/);

    const history = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        continue;
      }

      const [date, value] = line.split(",");

      // Skip FRED rows without an observation
      if (!date || !value) {
        continue;
      }

      const rate = Number(value);

      if (Number.isNaN(rate)) {
        continue;
      }

      history.push({
        date,
        rate
      });
    }

    res.json({
      pair: "USD/INR",
      source: "FRED",
      count: history.length,
      history
    });

  } catch (error) {
    console.error(
      "Historical data error:",
      error
    );

    res.status(500).json({
      error:
        "Unable to read historical USD/INR data"
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `1ZZ server running at http://localhost:${PORT}`
  );
});