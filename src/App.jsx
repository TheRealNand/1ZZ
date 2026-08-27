import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [rate, setRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("1M");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState(null);

  // ---------------------------------------------
  // LIVE RATE
  // ---------------------------------------------

  useEffect(() => {
    fetch("http://localhost:3001/api/rate")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to retrieve live rate");
        }

        return response.json();
      })
      .then((data) => {
        setRate(Number(data.rate));
      })
      .catch((error) => {
        console.error("Live rate error:", error);
      });
  }, []);

  // ---------------------------------------------
  // HISTORICAL DATA
  // ---------------------------------------------

  useEffect(() => {
    fetch("http://localhost:3001/api/history")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to retrieve historical data");
        }

        return response.json();
      })
      .then((data) => {
        setHistory(data.history || []);
        setLoadingHistory(false);
      })
      .catch((error) => {
        console.error("Historical data error:", error);
        setLoadingHistory(false);
      });
  }, []);

  // ---------------------------------------------
  // IST CLOCK + CURRENT DATE
  // ---------------------------------------------

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });

      setCurrentTime(`${time} IST`);
      setCurrentDate(now);
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------
  // SELECT GRAPH RANGE
  // ---------------------------------------------

  const chartData = useMemo(() => {
    if (!history.length) {
      return [];
    }

    if (range === "Max") {
      return history;
    }

    const days = {
      "1M": 30,
      "1Y": 365,
      "5Y": 1825,
    }[range];

    const latestDate = new Date(
      history[history.length - 1].date
    );

    const cutoff = new Date(latestDate);

    cutoff.setDate(cutoff.getDate() - days);

    return history.filter((item) => {
      return new Date(item.date) >= cutoff;
    });
  }, [history, range]);

  // ---------------------------------------------
  // ₹100 PREDICTION
  // ---------------------------------------------

  const prediction = useMemo(() => {
    if (
      !history.length ||
      typeof rate !== "number" ||
      !currentDate
    ) {
      return {
        targetDate: null,
        daysLeft: null,
      };
    }

    const points = history
      .map((item) => ({
        date: new Date(item.date),
        rate: Number(item.rate),
      }))
      .filter(
        (item) =>
          !Number.isNaN(item.date.getTime()) &&
          Number.isFinite(item.rate)
      );

    if (points.length < 2) {
      return {
        targetDate: null,
        daysLeft: null,
      };
    }

    // ---------------------------------------------
    // LINEAR REGRESSION
    // ---------------------------------------------

    const firstDate = points[0].date.getTime();

    const x = points.map(
      (point) =>
        (point.date.getTime() - firstDate) / 86400000
    );

    const y = points.map((point) => point.rate);

    const n = points.length;

    const sumX = x.reduce(
      (sum, value) => sum + value,
      0
    );

    const sumY = y.reduce(
      (sum, value) => sum + value,
      0
    );

    const sumXY = x.reduce(
      (sum, value, index) =>
        sum + value * y[index],
      0
    );

    const sumXX = x.reduce(
      (sum, value) => sum + value * value,
      0
    );

    const denominator =
      n * sumXX - sumX * sumX;

    if (denominator === 0) {
      return {
        targetDate: null,
        daysLeft: null,
      };
    }

    const slope =
      (n * sumXY - sumX * sumY) /
      denominator;

    // ---------------------------------------------
    // NO UPWARD TREND
    // ---------------------------------------------

    if (slope <= 0) {
      return {
        targetDate: null,
        daysLeft: null,
      };
    }

    // ---------------------------------------------
    // ESTIMATE DAYS TO ₹100
    // ---------------------------------------------

    const daysRequired =
      (100 - rate) / slope;

    if (
      !Number.isFinite(daysRequired) ||
      daysRequired <= 0
    ) {
      return {
        targetDate: currentDate,
        daysLeft: 0,
      };
    }

    // ---------------------------------------------
    // PREDICT TARGET DATE
    //
    // IMPORTANT:
    // The regression uses historical data, whose
    // latest point may be several days behind today.
    //
    // DAYS LEFT is the number of days required
    // from TODAY, so WHEN must also be calculated
    // from TODAY rather than the latest historical
    // data point.
    // ---------------------------------------------

    const targetDate = new Date(
      currentDate.getTime() +
        daysRequired * 86400000
    );

    const daysLeft = Math.ceil(daysRequired);

    return {
      targetDate,
      daysLeft,
    };
  }, [history, rate, currentDate]);

  // ---------------------------------------------
  // GRAPH GEOMETRY
  // ---------------------------------------------

  const graph = useMemo(() => {
    if (!chartData.length) {
      return null;
    }

    const width = 1200;
    const height = 300;

    const values = chartData
      .map((item) => Number(item.rate))
      .filter((value) => Number.isFinite(value));

    if (!values.length) {
      return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    const padding = Math.max(
      (max - min) * 0.08,
      0.1
    );

    const lower = min - padding;
    const upper = max + padding;

    const points = values.map(
      (value, index) => {
        const x =
          values.length === 1
            ? width / 2
            : (index /
                (values.length - 1)) *
              width;

        const y =
          height -
          ((value - lower) /
            (upper - lower)) *
            height;

        return {
          x,
          y,
        };
      }
    );

    const linePath = points
      .map((point, index) => {
        return `${
          index === 0 ? "M" : "L"
        } ${point.x} ${point.y}`;
      })
      .join(" ");

    const areaPath = `
      ${linePath}
      L ${width} ${height}
      L 0 ${height}
      Z
    `;

    return {
      width,
      height,
      linePath,
      areaPath,
      latestPoint:
        points[points.length - 1],
    };
  }, [chartData]);

  // ---------------------------------------------
  // DISPLAY VALUES
  // ---------------------------------------------

  const displayRate =
    typeof rate === "number"
      ? `₹${rate.toFixed(3)}`
      : "₹--";

  const distanceTo100 =
    typeof rate === "number"
      ? `₹${Math.max(
          0,
          100 - rate
        ).toFixed(3)}`
      : "₹--";

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  return (
    <main className="app">

      {/* TOP BAR */}

      <header className="topbar">

        <h1>1ZZ</h1>

        <div className="prediction">

          <span className="prediction-label">
            WHEN
          </span>

          <span className="prediction-value">
            {prediction.targetDate
              ? prediction.targetDate.toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  }
                )
              : "--"}
          </span>

        </div>

      </header>

      {/* HERO */}

      <section className="hero">

        <div className="rate">

          <span className="rate-value">
            {displayRate}
          </span>

          <span className="rate-label">
            USD / INR
          </span>

        </div>

        <div className="metrics">

          <div className="distance">

            <span className="distance-value">
              {distanceTo100}
            </span>

            <span className="distance-label">
              TO ₹100
            </span>

          </div>

          <div className="metric-divider"></div>

          <div className="time">

            <span className="time-value">
              {prediction.daysLeft !== null
                ? prediction.daysLeft
                : "--"}
            </span>

            <span className="time-label">
              DAYS LEFT
            </span>

          </div>

        </div>

      </section>

      {/* GRAPH */}

      <section className="chart-section">

        <div className="chart-header">

          <span className="chart-title">
            USD / INR
          </span>

          <div className="range-controls">

            {["1M", "1Y", "5Y", "Max"].map(
              (item) => (
                <button
                  key={item}
                  className={
                    range === item
                      ? "range-button active"
                      : "range-button"
                  }
                  onClick={() =>
                    setRange(item)
                  }
                >
                  {item}
                </button>
              )
            )}

          </div>

        </div>

        <div className="chart-wrapper">

          {loadingHistory ? (
            <div className="chart-loading">
              LOADING
            </div>
          ) : graph ? (
            <svg
              className="chart"
              viewBox={`0 0 ${graph.width} ${graph.height}`}
              preserveAspectRatio="none"
            >

              <defs>

                <linearGradient
                  id="graphFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor="#00ff66"
                    stopOpacity="0.18"
                  />

                  <stop
                    offset="100%"
                    stopColor="#00ff66"
                    stopOpacity="0"
                  />

                </linearGradient>

              </defs>

              <path
                d={graph.areaPath}
                fill="url(#graphFill)"
              />

              <path
                d={graph.linePath}
                fill="none"
                stroke="#00ff66"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              <circle
                cx={graph.latestPoint.x}
                cy={graph.latestPoint.y}
                r="4"
                fill="#00ff66"
              />

            </svg>
          ) : (
            <div className="chart-loading">
              NO DATA
            </div>
          )}

        </div>

      </section>

      {/* STATUS */}

      <footer className="status">

        <span className="live-dot"></span>

        <span>LIVE</span>

        <span className="status-separator">
          ·
        </span>

        <span>
          {currentTime ||
            "--:--:-- IST"}
        </span>

      </footer>

    </main>
  );
}

export default App;