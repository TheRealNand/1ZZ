function App() {
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
          <span className="rate-value">₹95.42</span>
          <span className="rate-label">USD / INR</span>
        </div>

        <div className="distance">
          <span className="distance-value">₹4.58</span>
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
        <span>--:--:-- IST</span>
      </footer>
    </main>
  );
}

export default App;