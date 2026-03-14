import { useEffect, useState } from "react";
import babylonBackground from "../Babylonfull.webp";
import dwellingBackground from "../dwelling.jpg";
import iceCavesBackground from "../Ice_Caves.png";
import jungleBackground from "../jungle.jpg";
import sunkenCityBackground from "../Sunken City.jpg";
import templeBackground from "../temple.png";
import tidePoolBackground from "../Tidepool.jpg";
import volcanaBackground from "../Volcana.webp";

const BOARD_SIZE = 5;

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = configuredApiBaseUrl || (isLocalhost ? "http://localhost:8000" : "");
const AREA_BACKGROUNDS = {
  dwelling: dwellingBackground,
  volcana: volcanaBackground,
  jungle: jungleBackground,
  tide_pool: tidePoolBackground,
  ice_caves: iceCavesBackground,
  neo_babylon: babylonBackground,
  sunken_city: sunkenCityBackground,
  temple: templeBackground,
};

function countCheckedBoxes(marks) {
  return marks.filter(Boolean).length;
}

function countBingos(marks) {
  let bingoCount = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const isCompleteRow = Array.from({ length: BOARD_SIZE }, (_, column) => {
      return Boolean(marks[row * BOARD_SIZE + column]);
    }).every(Boolean);

    if (isCompleteRow) {
      bingoCount += 1;
    }
  }

  for (let column = 0; column < BOARD_SIZE; column += 1) {
    const isCompleteColumn = Array.from({ length: BOARD_SIZE }, (_, row) => {
      return Boolean(marks[row * BOARD_SIZE + column]);
    }).every(Boolean);

    if (isCompleteColumn) {
      bingoCount += 1;
    }
  }

  const isCompleteMainDiagonal = Array.from({ length: BOARD_SIZE }, (_, index) => {
    return Boolean(marks[index * BOARD_SIZE + index]);
  }).every(Boolean);

  if (isCompleteMainDiagonal) {
    bingoCount += 1;
  }

  const isCompleteAntiDiagonal = Array.from({ length: BOARD_SIZE }, (_, index) => {
    return Boolean(marks[index * BOARD_SIZE + (BOARD_SIZE - 1 - index)]);
  }).every(Boolean);

  if (isCompleteAntiDiagonal) {
    bingoCount += 1;
  }

  return bingoCount;
}

async function fetchPromptsForArea(areaId) {
  const response = await fetch(
    `${API_BASE_URL}/api/prompts?count=25&area=${encodeURIComponent(areaId)}`
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to load prompts");
  }

  const payload = await response.json();
  return payload.prompts || [];
}

export default function App() {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [promptsByArea, setPromptsByArea] = useState({});
  const [markedByArea, setMarkedByArea] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const prompts = selectedArea ? promptsByArea[selectedArea] || [] : [];
  const checkedBoxCount = Object.values(markedByArea).reduce((total, marks) => {
    return total + countCheckedBoxes(marks || []);
  }, 0);
  const bingoCount = Object.values(markedByArea).reduce((total, marks) => {
    return total + countBingos(marks || []);
  }, 0);

  const loadPrompts = async (areaId) => {
    setLoading(true);
    setError("");

    if (!API_BASE_URL) {
      setError(
        "Missing VITE_API_BASE_URL. Add it as a GitHub Actions repository variable and redeploy."
      );
      setPromptsByArea({});
      setLoading(false);
      return;
    }

    try {
      const prompts = await fetchPromptsForArea(areaId);
      setPromptsByArea((previous) => ({
        ...previous,
        [areaId]: prompts,
      }));
      setMarkedByArea((previous) => ({
        ...previous,
        [areaId]: [],
      }));
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError(`Failed to reach API at ${API_BASE_URL}. Confirm URL is correct and backend is live over HTTPS.`);
      } else {
        setError(requestError.message || "Unexpected error");
      }
      setPromptsByArea((previous) => ({
        ...previous,
        [areaId]: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  const refreshAllPrompts = async () => {
    if (!API_BASE_URL) {
      setError(
        "Missing VITE_API_BASE_URL. Add it as a GitHub Actions repository variable and redeploy."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const areaIds = areas.map((area) => area.id);
      const promptResults = await Promise.all(
        areaIds.map(async (areaId) => [areaId, await fetchPromptsForArea(areaId)])
      );

      setPromptsByArea((previous) => ({
        ...previous,
        ...Object.fromEntries(promptResults),
      }));
      setMarkedByArea((previous) => ({
        ...previous,
        ...Object.fromEntries(areaIds.map((areaId) => [areaId, []])),
      }));
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError(`Failed to reach API at ${API_BASE_URL}. Confirm URL is correct and backend is live over HTTPS.`);
      } else {
        setError(requestError.message || "Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAreas = async () => {
    if (!API_BASE_URL) {
      setError(
        "Missing VITE_API_BASE_URL. Add it as a GitHub Actions repository variable and redeploy."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/areas`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load areas");
      }

      const payload = await response.json();
      const fetchedAreas = payload.areas || [];
      setAreas(fetchedAreas);

      if (fetchedAreas.length === 0) {
        setError("No area prompt files found.");
        setPromptsByArea({});
        setLoading(false);
        return;
      }

      const firstArea = fetchedAreas[0].id;
      setSelectedArea(firstArea);
      await loadPrompts(firstArea);
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError(`Failed to reach API at ${API_BASE_URL}. Confirm URL is correct and backend is live over HTTPS.`);
      } else {
        setError(requestError.message || "Unexpected error");
      }
      setPromptsByArea({});
      setLoading(false);
    }
  };

  const onAreaClick = async (areaId) => {
    if (areaId === selectedArea) {
      return;
    }

    setSelectedArea(areaId);
    setError("");

    const existingPrompts = promptsByArea[areaId] || [];
    if (existingPrompts.length === 0) {
      await loadPrompts(areaId);
    }
  };

  const onPromptClick = (index) => {
    if (!selectedArea) {
      return;
    }

    setMarkedByArea((previous) => {
      const previousMarks = previous[selectedArea] || [];
      const nextMarks = [...previousMarks];
      nextMarks[index] = !nextMarks[index];

      return {
        ...previous,
        [selectedArea]: nextMarks,
      };
    });
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const pageStyle = AREA_BACKGROUNDS[selectedArea]
    ? {
        backgroundColor: "#000000",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${AREA_BACKGROUNDS[selectedArea]})`,
      }
    : { backgroundColor: "#000000" };

  return (
    <main className="page" style={pageStyle}>
      <header className="header-bar">
        <div className="header-chip">Checked: {checkedBoxCount}</div>
        <h1 className="title">Spelunky Bingo!</h1>
        <div className="header-chip">Bingos: {bingoCount}</div>
      </header>

      <section className="tabs" aria-label="Area tabs">
        {areas.map((area) => (
          <button
            key={area.id}
            type="button"
            className={`tab-button ${selectedArea === area.id ? "active" : ""}`}
            onClick={() => onAreaClick(area.id)}
          >
            {area.label}
          </button>
        ))}
      </section>

      {error ? <p className="status error">{error}</p> : null}
      {!loading && !error && selectedArea && prompts.length === 0 ? (
        <p className="status">Press "New Prompts" to generate this area board.</p>
      ) : null}

      <section className="prompt-row" aria-live="polite">
        {prompts.map((prompt, index) => (
          <button
            key={`${prompt}-${index}`}
            type="button"
            className={`prompt-box ${markedByArea[selectedArea]?.[index] ? "marked" : ""}`}
            onClick={() => onPromptClick(index)}
          >
            {prompt}
          </button>
        ))}
      </section>

      <div className="actions-row">
        <button
          type="button"
          className="refresh-button"
          onClick={() => loadPrompts(selectedArea)}
          disabled={!selectedArea}
        >
          New Prompts
        </button>

        <button
          type="button"
          className="refresh-button"
          onClick={refreshAllPrompts}
          disabled={areas.length === 0}
        >
          Refresh All
        </button>
      </div>
    </main>
  );
}
