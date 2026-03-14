import { useEffect, useState } from "react";

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = configuredApiBaseUrl || (isLocalhost ? "http://localhost:8000" : "");

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPrompts = async () => {
    setLoading(true);
    setError("");

    if (!API_BASE_URL) {
      setError(
        "Missing VITE_API_BASE_URL. Add it as a GitHub Actions repository variable and redeploy."
      );
      setPrompts([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts?count=5`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load prompts");
      }

      const payload = await response.json();
      setPrompts(payload.prompts || []);
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError(`Failed to reach API at ${API_BASE_URL}. Confirm URL is correct and backend is live over HTTPS.`);
      } else {
        setError(requestError.message || "Unexpected error");
      }
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
