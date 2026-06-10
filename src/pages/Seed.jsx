import { useState } from "react";
import { runSeed } from "../helpers/seed";

export default function Seed() {
  const [logs, setLogs] = useState([]);
  const [seeding, setSeeding] = useState(false);

  const logMessage = (msg, cls = "") => {
    setLogs((prev) => [...prev, { msg, cls }]);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setLogs([]);
    try {
      await runSeed(logMessage);
      logMessage("✅ All done! You can now use the app.", "text-success");
    } catch (err) {
      logMessage("❌ " + err.message, "text-danger");
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="seed-card" style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '40px', maxWidth: '640px', width: '100%', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px' }}><i className="bi bi-database-fill-gear"></i> Seed Database</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          This will populate your Firestore with sample data for all collections.<br />
          Make sure you're logged in (Firebase Auth) or Firestore rules allow writes.
        </p>

        <button className="btn-brand" onClick={handleSeed} disabled={seeding} style={{ minWidth: '200px' }}>
          {seeding ? <><span className="btn-spinner"></span> Seeding…</> : <><i className="bi bi-play-fill me-1"></i> Run Seed</>}
        </button>

        {logs.length > 0 && (
          <div id="log" style={{ textAlign: 'left', background: 'var(--dark)', color: '#a0f0a0', padding: '16px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.8rem', maxHeight: '360px', overflowY: 'auto', marginTop: '20px', whiteSpace: 'pre-wrap' }}>
            {logs.map((l, i) => (
              <div key={i} className={l.cls}>{l.msg}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
