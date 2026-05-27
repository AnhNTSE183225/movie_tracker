const GENRE_ANALYTICS_ROWS = document.getElementById("genreAnalyticsRows");
const SUGGESTOR_ANALYTICS_ROWS = document.getElementById("suggestorAnalyticsRows");
const GENRE_PIE_CHART = document.getElementById("genrePieChart");
const GENRE_CHART_LEGEND = document.getElementById("genreChartLegend");

const ANALYTICS_DATA = window.MOVIE_DATA || { genres: {}, suggestors: {}, movies: [] };
const ANALYTICS_THEME = window.MOVIE_THEME || { genreColors: {} };
const PIE_COLOR_FALLBACK = [
  "#f6c453",
  "#84d8c4",
  "#8ab0ff",
  "#f08d70",
  "#df8cff",
  "#5cc6ff",
  "#a9d66f",
  "#f7a9d0",
];
let analyticsRatingIdSeed = 0;

function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeRating(value) {
  const numeric = toNumber(value);
  if (numeric === null) {
    return null;
  }
  if (numeric < 0) {
    return null;
  }
  return Math.min(10, numeric);
}

function rankChipClass(rank) {
  if (rank === 1) {
    return "rank-chip rank-chip--1";
  }
  if (rank === 2) {
    return "rank-chip rank-chip--2";
  }
  if (rank === 3) {
    return "rank-chip rank-chip--3";
  }
  return "rank-chip";
}

function normalizeMovies(movies) {
  return movies.map((movie) => ({
    title: movie.title,
    genreKey: movie.genre,
    rating: sanitizeRating(movie.rating),
    suggestors: Array.isArray(movie.suggestors) ? movie.suggestors : [],
  }));
}

function buildGenreStats(movies, genresMap) {
  const counts = Object.keys(genresMap).reduce((result, genreKey) => {
    result[genreKey] = 0;
    return result;
  }, {});

  for (const movie of movies) {
    if (!(movie.genreKey in counts)) {
      counts[movie.genreKey] = 0;
    }
    counts[movie.genreKey] += 1;
  }

  return Object.entries(counts)
    .map(([genreKey, count], index) => ({
      key: genreKey,
      label: genresMap[genreKey] ?? genreKey,
      count,
      color: ANALYTICS_THEME.genreColors[genreKey] ?? PIE_COLOR_FALLBACK[index % PIE_COLOR_FALLBACK.length],
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildSuggestorStats(movies, suggestorsMap) {
  const suggestorSummary = Object.keys(suggestorsMap).reduce((result, key) => {
    result[key] = {
      count: 0,
      scoreSum: 0,
      scoreCount: 0,
    };
    return result;
  }, {});

  for (const movie of movies) {
    for (const suggestorKey of movie.suggestors) {
      if (!(suggestorKey in suggestorSummary)) {
        suggestorSummary[suggestorKey] = {
          count: 0,
          scoreSum: 0,
          scoreCount: 0,
        };
      }

      suggestorSummary[suggestorKey].count += 1;
      if (movie.rating !== null) {
        suggestorSummary[suggestorKey].scoreSum += movie.rating;
        suggestorSummary[suggestorKey].scoreCount += 1;
      }
    }
  }

  return Object.entries(suggestorSummary)
    .map(([key, metrics]) => ({
      key,
      label: suggestorsMap[key] ?? key,
      count: metrics.count,
      averageScore: metrics.scoreCount === 0 ? null : metrics.scoreSum / metrics.scoreCount,
    }))
    .sort((left, right) => {
      const leftAvg = left.averageScore === null ? Number.NEGATIVE_INFINITY : left.averageScore;
      const rightAvg = right.averageScore === null ? Number.NEGATIVE_INFINITY : right.averageScore;
      return rightAvg - leftAvg || right.count - left.count || left.label.localeCompare(right.label);
    });
}

function renderGenreTable(stats) {
  GENRE_ANALYTICS_ROWS.innerHTML = "";

  for (const [index, item] of stats.entries()) {
    const rank = index + 1;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="Rank"><span class="${rankChipClass(rank)}">${rank}</span></td>
      <td data-label="Category name">${item.label}</td>
      <td data-label="Movies watched"><span class="metric-number">${item.count}</span></td>
    `;

    GENRE_ANALYTICS_ROWS.appendChild(row);
  }
}

function renderSuggestorTable(stats) {
  SUGGESTOR_ANALYTICS_ROWS.innerHTML = "";

  for (const [index, item] of stats.entries()) {
    const rank = index + 1;
    const averageText = item.averageScore === null ? "-" : `${item.averageScore.toFixed(1)}/10`;
    const averageLabel = item.averageScore === null ? "No average rating available" : `${item.averageScore.toFixed(1)} out of 10`;
    const hasAverageScore = item.averageScore !== null;
    const normalizedScore = hasAverageScore ? Math.max(0, Math.min(10, item.averageScore)) : 0;
    const fillWidth = (normalizedScore / 10) * 160;
    const clipId = `analyticsRatingClip-${analyticsRatingIdSeed += 1}`;
    const starPaths = Array.from({ length: 10 }, (_, starIndex) => `
      <g transform="translate(${starIndex * 16} 0)"><path transform="translate(0 0) scale(0.55)" d="M15 1.5l3.53 7.15 7.89 1.15-5.71 5.56 1.35 7.85L15 19.53l-7.06 3.68 1.35-7.85-5.71-5.56 7.89-1.15L15 1.5z"></path></g>
    `).join("");
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="Rank"><span class="${rankChipClass(rank)}">${rank}</span></td>
      <td data-label="Name">${item.label}</td>
      <td data-label="Movies suggested"><span class="metric-number">${item.count}</span></td>
      <td data-label="Average score">
        <div class="suggestor-score">
          ${hasAverageScore ? `
            <div class="rating-stars rating-stars--compact" role="img" aria-label="${averageLabel}">
              <svg viewBox="0 0 160 16" class="rating-stars__svg" aria-hidden="true" focusable="false">
                <defs>
                  <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="${fillWidth}" height="16"></rect>
                  </clipPath>
                </defs>
                <g class="rating-stars__base">${starPaths}</g>
                <g class="rating-stars__fill" clip-path="url(#${clipId})">${starPaths}</g>
              </svg>
            </div>
          ` : ``}
          <span class="metric-number suggestor-score__value">${averageText}</span>
        </div>
      </td>
    `;

    SUGGESTOR_ANALYTICS_ROWS.appendChild(row);
  }
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function renderGenrePieChart(stats) {
  GENRE_PIE_CHART.innerHTML = "";
  GENRE_CHART_LEGEND.innerHTML = "";

  const chartStats = stats.filter((item) => item.count > 0);
  const total = chartStats.reduce((sum, item) => sum + item.count, 0);
  const centerX = 130;
  const centerY = 130;
  const outerRadius = 94;
  const innerRadius = 52;

  if (total === 0) {
    const emptyRing = createSvgElement("circle");
    emptyRing.setAttribute("cx", String(centerX));
    emptyRing.setAttribute("cy", String(centerY));
    emptyRing.setAttribute("r", String(outerRadius));
    emptyRing.setAttribute("fill", "none");
    emptyRing.setAttribute("stroke", "rgba(255,255,255,0.12)");
    emptyRing.setAttribute("stroke-width", String(outerRadius - innerRadius));
    GENRE_PIE_CHART.appendChild(emptyRing);

    const message = createSvgElement("text");
    message.setAttribute("x", String(centerX));
    message.setAttribute("y", String(centerY + 6));
    message.setAttribute("text-anchor", "middle");
    message.setAttribute("fill", "#9aa6b7");
    message.setAttribute("font-size", "15");
    message.setAttribute("font-weight", "700");
    message.textContent = "No data";
    GENRE_PIE_CHART.appendChild(message);
    return;
  }

  const circumference = 2 * Math.PI * ((outerRadius + innerRadius) / 2);
  const ringThickness = outerRadius - innerRadius;
  let progress = 0;

  const backgroundRing = createSvgElement("circle");
  backgroundRing.setAttribute("cx", String(centerX));
  backgroundRing.setAttribute("cy", String(centerY));
  backgroundRing.setAttribute("r", String((outerRadius + innerRadius) / 2));
  backgroundRing.setAttribute("fill", "none");
  backgroundRing.setAttribute("stroke", "rgba(255,255,255,0.08)");
  backgroundRing.setAttribute("stroke-width", String(ringThickness));
  GENRE_PIE_CHART.appendChild(backgroundRing);

  for (const item of chartStats) {
    const sliceRatio = item.count / total;
    const sliceLength = Math.max(0, sliceRatio * circumference - 1.2);
    const color = item.color;

    const slice = createSvgElement("circle");
    slice.setAttribute("cx", String(centerX));
    slice.setAttribute("cy", String(centerY));
    slice.setAttribute("r", String((outerRadius + innerRadius) / 2));
    slice.setAttribute("fill", "none");
    slice.setAttribute("stroke", color);
    slice.setAttribute("stroke-width", String(ringThickness));
    slice.setAttribute("stroke-linecap", "butt");
    slice.setAttribute("stroke-dasharray", `${sliceLength} ${circumference}`);
    slice.setAttribute("stroke-dashoffset", String(-progress));
    slice.setAttribute("transform", `rotate(-90 ${centerX} ${centerY})`);
    slice.classList.add("genre-donut-slice");
    slice.setAttribute("tabindex", "0");
    slice.setAttribute("role", "graphics-symbol");
    slice.setAttribute("aria-label", `${item.label}: ${item.count} movies`);

    const tooltip = createSvgElement("title");
    tooltip.textContent = `${item.label}: ${item.count}`;
    slice.appendChild(tooltip);
    GENRE_PIE_CHART.appendChild(slice);

    const legendItem = document.createElement("div");
    legendItem.className = "chart-legend__item";
    legendItem.innerHTML = `
      <span class="chart-legend__swatch" style="background:${color}"></span>
      <span>${item.label}</span>
      <span class="metric-number">${item.count}</span>
    `;
    GENRE_CHART_LEGEND.appendChild(legendItem);

    progress += sliceRatio * circumference;
  }

  const totalLabel = createSvgElement("text");
  totalLabel.setAttribute("x", String(centerX));
  totalLabel.setAttribute("y", String(centerY - 8));
  totalLabel.setAttribute("text-anchor", "middle");
  totalLabel.setAttribute("fill", "#9aa6b7");
  totalLabel.setAttribute("font-size", "11");
  totalLabel.setAttribute("font-weight", "700");
  totalLabel.setAttribute("letter-spacing", "1.2");
  totalLabel.textContent = "TOTAL";
  GENRE_PIE_CHART.appendChild(totalLabel);

  const totalValue = createSvgElement("text");
  totalValue.setAttribute("x", String(centerX));
  totalValue.setAttribute("y", String(centerY + 20));
  totalValue.setAttribute("text-anchor", "middle");
  totalValue.setAttribute("fill", "#f4f7fb");
  totalValue.setAttribute("font-size", "34");
  totalValue.setAttribute("font-weight", "800");
  totalValue.textContent = String(total);
  GENRE_PIE_CHART.appendChild(totalValue);
}

function renderAnalytics() {
  if (!GENRE_ANALYTICS_ROWS || !SUGGESTOR_ANALYTICS_ROWS || !GENRE_PIE_CHART || !GENRE_CHART_LEGEND) {
    return;
  }

  const movies = normalizeMovies(ANALYTICS_DATA.movies || []);
  const genreStats = buildGenreStats(movies, ANALYTICS_DATA.genres || {});
  const suggestorStats = buildSuggestorStats(movies, ANALYTICS_DATA.suggestors || {});

  renderGenreTable(genreStats);
  renderGenrePieChart(genreStats);
  renderSuggestorTable(suggestorStats);
}

renderAnalytics();
