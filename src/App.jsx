import { useEffect, useState } from "react";

function App() {
  const [rate, setRate] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/rate");

        if (!response.ok) {
          throw new Error("Failed to fetch USD/INR rate");
        }

        const data = await response.json();

        setRate(data.rate);
        setUpdatedAt(data.timestamp);
      } catch (error) {
        console.error("Rate fetch error:", error);
      }
    };

    fetchRate();
  }, []);

  const distance = rate !== null ? 100 - rate : null;

  const formattedRate =
    rate !== null ? `₹${rate.toFixed(3)}` : "₹--";

  const formattedDistance =
    distance !== null ? `₹${distance.toFixed(2)}` : "₹--";

  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "--:--:--";

  return (
    <main className="app">
      <header className="topbar">
        <h1>1ZZ</h1>

        <div className="prediction">
          <span className="prediction-label">WHEN</span>
          <span className="prediction-value">--</span>
        </div>
      </header>

      <section className="hero">
        <div className="rate">
          <span className="rate-value">{formattedRate}</span>
          <span className="rate-label">USD / INR</span>
        </div>

        <div className="distance">
          <span className="distance-value">{formattedDistance}</span>
          <span className="distance-label">TO ₹100</span>
        </div>

        <div className="time">
          <span className="time-value">--</span>
          <span className="time-label">DAYS LEFT</span>
        </div>
      </section>

      <footer className="status">
        <span className="live-dot"></span>
        <span>LIVE</span>
        <span className="status-separator">·</span>
        <span>{formattedTime} IST</span>
      </footer>
    </main>
  );
}

export default App;