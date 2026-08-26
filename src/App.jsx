import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [rate, setRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("1M");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

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
  // IST CLOCK
  // ---------------------------------------------

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });

      setCurrentTime(`${time} IST`);
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

    const padding = Math.max((max - min) * 0.08, 0.1);

    const lower = min - padding;
    const upper = max + padding;

    const points = values.map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : (index / (values.length - 1)) * width;

      const y =
        height -
        ((value - lower) / (upper - lower)) * height;

      return {
        x,
        y,
      };
    });

    const linePath = points
      .map((point, index) => {
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
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
      latestPoint: points[points.length - 1],
    };
  }, [chartData]);

  // ---------------------------------------------
  // DISPLAY VALUES
  // ---------------------------------------------

  const displayRate =
    typeof rate === "number"
      ? `₹${rate.toFixed(2)}`
      : "₹--";

  const distanceTo100 =
    typeof rate === "number"
      ? `₹${Math.max(0, 100 - rate).toFixed(2)}`
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
            --
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
              --
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

            {["1M", "1Y", "5Y", "Max"].map((item) => (
              <button
                key={item}
                className={
                  range === item
                    ? "range-button active"
                    : "range-button"
                }
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}

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
          {currentTime || "--:--:-- IST"}
        </span>

      </footer>

    </main>
  );
}

export default App;