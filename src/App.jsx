import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [rate, setRate] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // ---------------------------------------------
  // LIVE RATE
  // ---------------------------------------------

  useEffect(() => {
    const fetchRate = () => {
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
    };

    fetchRate();

    // Refresh the exchange rate periodically.
    const interval = setInterval(fetchRate, 60000);

    return () => clearInterval(interval);
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


        {/* METRICS */}

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