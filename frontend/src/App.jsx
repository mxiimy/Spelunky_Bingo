import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPrompts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts?count=5`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load prompts");
      }

      const payload = await response.json();
      setPrompts(payload.prompts || []);
    } catch (requestError) {
      setError(requestError.message || "Unexpected error");
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  return (
    <main className="page">
      <h1 className="title">Spelunky Bingo Prompts</h1>

      {loading ? <p className="status">Loading prompts...</p> : null}
      {error ? <p className="status error">{error}</p> : null}

      <section className="prompt-row" aria-live="polite">
        {prompts.map((prompt, index) => (
          <article key={`${prompt}-${index}`} className="prompt-box">
            {prompt}
          </article>
        ))}
      </section>

      <button type="button" className="refresh-button" onClick={loadPrompts}>
        New Prompts
      </button>
    </main>
  );
}
