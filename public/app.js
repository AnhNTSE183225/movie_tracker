const movieRows = document.getElementById("movieRows");
const movieCount = document.getElementById("movieCount");
const highestRating = document.getElementById("highestRating");
const topPick = document.getElementById("topPick");
const titleFilterInput = document.getElementById("titleFilter");
const yearFilterSelect = document.getElementById("yearFilter");
const genreFilterSelect = document.getElementById("genreFilter");
const ratingFilterSelect = document.getElementById("ratingFilter");
const suggestorFilterSelect = document.getElementById("suggestorFilter");
const clearFiltersButton = document.getElementById("clearFilters");
const filterSummary = document.getElementById("filterSummary");
const sortHeaderButtons = Array.from(document.querySelectorAll(".sort-header"));
let ratingIdSeed = 0;

const MOVIE_DATA = window.MOVIE_DATA || { genres: {}, suggestors: {}, movies: [] };
const MOVIE_THEME = window.MOVIE_THEME || { genreColors: {} };
const SORTABLE_FIELDS = ["title", "year", "genre", "rating", "suggestors"];
const SORT_FIELD_LABELS = {
  title: "Title",
  year: "Year",
  genre: "Genre",
  rating: "Rating",
  suggestors: "Suggestors",
};

const state = {
  title: "",
  year: "",
  genre: "all",
  rating: "all",
  suggestor: "all",
  sortField: "rating",
  sortDirection: "desc",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseRating(rawRating) {
  if (rawRating === null || rawRating === undefined || rawRating === "") {
    return {
      kind: "unrated",
      value: null,
      sortValue: Number.NEGATIVE_INFINITY,
      label: "Unrated",
    };
  }

  const numericRating = Number.parseFloat(rawRating);

  if (!Number.isFinite(numericRating)) {
    return {
      kind: "unrated",
      value: null,
      sortValue: Number.NEGATIVE_INFINITY,
      label: "Unrated",
    };
  }

  return {
    kind: numericRating < 0 ? "negative" : "positive",
    value: numericRating,
    sortValue: numericRating,
    label: `${numericRating.toFixed(1)}/10`,
  };
}

function getGenreLabel(genreKey) {
  return MOVIE_DATA.genres[genreKey] ?? genreKey;
}

function getGenreColor(genreKey) {
  return MOVIE_THEME.genreColors[genreKey] ?? "#9aa6b7";
}

function getSuggestorLabel(suggestorKey) {
  return MOVIE_DATA.suggestors[suggestorKey] ?? suggestorKey;
}

function buildTenStarPath(index) {
  const offset = index * 16;
  return `<g transform="translate(${offset} 0)"><path transform="translate(0 0) scale(0.55)" d="M15 1.5l3.53 7.15 7.89 1.15-5.71 5.56 1.35 7.85L15 19.53l-7.06 3.68 1.35-7.85-5.71-5.56 7.89-1.15L15 1.5z"></path></g>`;
}

function createTenStarMeter(rating) {
  const normalizedScore = Math.max(0, Math.min(10, Number(rating)));
  const totalWidth = 160;
  const fillWidth = (normalizedScore / 10) * totalWidth;
  const starPaths = Array.from({ length: 10 }, (_, index) => buildTenStarPath(index)).join("");
  const clipId = `ratingClip-${ratingIdSeed += 1}`;

  return `
    <div class="rating-stars" role="img" aria-label="${normalizedScore.toFixed(1)} out of 10">
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
  `;
}

function normalizeMovie(movie, index) {
  let rating = movie.rating;
  if (rating === null || rating === undefined) {
    if (Array.isArray(movie.episodes) && movie.episodes.length > 0) {
      const ratedEps = movie.episodes.filter(e => e.rating != null);
      if (ratedEps.length > 0) {
        rating = ratedEps.reduce((sum, e) => sum + e.rating, 0) / ratedEps.length;
      }
    }
  }

  return {
    id: `${movie.title}-${movie.year}-${index}`,
    title: movie.title,
    year: Number(movie.year),
    genre: movie.genre,
    genreLabel: getGenreLabel(movie.genre),
    genreColor: getGenreColor(movie.genre),
    rating: parseRating(rating),
    suggestors: Array.isArray(movie.suggestors) ? movie.suggestors : [],
    suggestorLabels: Array.isArray(movie.suggestors) ? movie.suggestors.map((suggestorKey) => getSuggestorLabel(suggestorKey)) : [],
  };
}

function populateSelect(selectElement, values, includeAllLabel = "All") {
  selectElement.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = includeAllLabel;
  selectElement.appendChild(allOption);

  for (const value of values) {
    const option = document.createElement("option");
    if (typeof value === "string") {
      option.value = value;
      option.textContent = value;
    } else {
      option.value = value.value;
      option.textContent = value.label;
    }
    selectElement.appendChild(option);
  }
}

function compareValues(leftMovie, rightMovie, field) {
  switch (field) {
    case "title":
      return leftMovie.title.localeCompare(rightMovie.title);
    case "year":
      return leftMovie.year - rightMovie.year;
    case "genre":
      return leftMovie.genreLabel.localeCompare(rightMovie.genreLabel);
    case "rating":
      return leftMovie.rating.sortValue - rightMovie.rating.sortValue;
    case "suggestors":
      return leftMovie.suggestorLabels.join(", ").localeCompare(rightMovie.suggestorLabels.join(", "));
    default:
      return 0;
  }
}

function matchesFilters(movie) {
  const titleQuery = state.title.trim().toLowerCase();
  const movieYear = String(movie.year);

  if (titleQuery && !movie.title.toLowerCase().includes(titleQuery)) {
    return false;
  }

  if (state.year !== "all" && movieYear !== state.year) {
    return false;
  }

  if (state.genre !== "all" && movie.genre !== state.genre) {
    return false;
  }

  if (state.suggestor !== "all" && !movie.suggestors.includes(state.suggestor)) {
    return false;
  }

  if (state.rating !== "all") {
    const ratingValue = movie.rating.value;
    if (state.rating === "unrated" && movie.rating.kind !== "unrated") {
      return false;
    }
    if (state.rating === "rated" && movie.rating.kind === "unrated") {
      return false;
    }
    if (state.rating === "positive" && movie.rating.kind !== "positive") {
      return false;
    }
    if (state.rating === "negative" && movie.rating.kind !== "negative") {
      return false;
    }
    if (state.rating === "zero" && ratingValue !== 0) {
      return false;
    }
  }

  return true;
}

function updateFilterSummary(totalCount, visibleCount) {
  const hiddenCount = totalCount - visibleCount;
  const summaryParts = [
    `${visibleCount} of ${totalCount} movies shown`,
    `sorted by ${SORT_FIELD_LABELS[state.sortField]} ${state.sortDirection === "asc" ? "ascending" : "descending"}`,
  ];

  if (hiddenCount > 0) {
    summaryParts.unshift(`${hiddenCount} hidden by filters`);
  }

  filterSummary.textContent = summaryParts.join(" • ");
}

function updateSortHeaderIndicators() {
  for (const button of sortHeaderButtons) {
    const field = button.dataset.sortField;
    const arrow = button.querySelector(".sort-header__arrow");
    const isActive = field === state.sortField;

    button.classList.toggle("sort-header--active", isActive);
    button.dataset.sortDirection = isActive ? state.sortDirection : "none";
    button.setAttribute("aria-sort", isActive ? (state.sortDirection === "asc" ? "ascending" : "descending") : "none");
    if (arrow) {
      arrow.dataset.direction = isActive ? state.sortDirection : "none";
      arrow.textContent = "";
    }
  }
}

function setSort(field, direction = field === state.sortField ? (state.sortDirection === "asc" ? "desc" : "asc") : "desc") {
  state.sortField = field;
  state.sortDirection = direction;
  updateSortHeaderIndicators();
  renderMovies();
}

function renderMovies() {
  if (!MOVIE_DATA.movies.length) {
    throw new Error("Missing movie data source: movies-data.js");
  }

  const movies = MOVIE_DATA.movies.map(normalizeMovie).filter(matchesFilters);
  const directionFactor = state.sortDirection === "asc" ? 1 : -1;

  movies.sort((leftMovie, rightMovie) => directionFactor * compareValues(leftMovie, rightMovie, state.sortField));

  movieRows.innerHTML = "";

  for (const movie of movies) {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.dataset.label = "Title";
    const title = document.createElement("span");
    title.className = "movie-title";
    title.textContent = movie.title;
    titleCell.appendChild(title);

    const yearCell = document.createElement("td");
    yearCell.dataset.label = "Year";
    const year = document.createElement("span");
    year.className = "year-pill";
    year.textContent = movie.year;
    yearCell.appendChild(year);

    const genreCell = document.createElement("td");
    genreCell.dataset.label = "Genre";
    const genre = document.createElement("span");
    genre.className = "genre-pill";
    genre.textContent = movie.genreLabel;
    genre.style.setProperty("--genre-color", movie.genreColor);
    genreCell.appendChild(genre);

    const ratingCell = document.createElement("td");
    ratingCell.dataset.label = "Rating";
    const ratingBlock = document.createElement("div");
    ratingBlock.className = "rating-block";

    if (movie.rating.kind === "unrated") {
      ratingBlock.classList.add("rating-block--unrated");

      const ratingPill = document.createElement("span");
      ratingPill.className = "rating-pill rating-pill--unrated";
      ratingPill.textContent = "Unrated";
      ratingBlock.appendChild(ratingPill);
    } else {
      const ratingMeta = document.createElement("div");
      ratingMeta.className = "rating-meta";
      ratingMeta.innerHTML = createTenStarMeter(movie.rating.value);

      const ratingValue = document.createElement("span");
      ratingValue.className = "rating-value";
      if (movie.rating.kind === "negative") {
        ratingValue.classList.add("rating-value--negative");
      }
      ratingValue.textContent = `${movie.rating.value.toFixed(1)}/10`;
      ratingMeta.appendChild(ratingValue);
      ratingBlock.appendChild(ratingMeta);
    }

    ratingCell.appendChild(ratingBlock);

    const suggestorsCell = document.createElement("td");
    suggestorsCell.dataset.label = "Suggestors";
    const suggestorsWrap = document.createElement("div");
    suggestorsWrap.className = "suggestors";
    for (const name of movie.suggestorLabels) {
      const pill = document.createElement("span");
      pill.className = "suggestor-pill";
      pill.textContent = name;
      suggestorsWrap.appendChild(pill);
    }
    suggestorsCell.appendChild(suggestorsWrap);

    row.append(titleCell, yearCell, genreCell, ratingCell, suggestorsCell);
    movieRows.appendChild(row);
  }

  const totalMovies = movies.length;
  const scoredMovies = movies.filter((movie) => Number.isFinite(movie.rating.value));
  const highestScore = scoredMovies.length > 0 ? Math.max(...scoredMovies.map((movie) => movie.rating.value)) : null;
  const topRatedMovie = movies[0] || null;

  movieCount.textContent = String(totalMovies);
  highestRating.textContent = highestScore === null ? "—" : highestScore.toFixed(1);
  topPick.textContent = topRatedMovie ? topRatedMovie.title : "-";
  updateFilterSummary(MOVIE_DATA.movies.length, movies.length);
  document.body.dataset.moviesReady = "true";
}

function syncStateFromControls() {
  state.title = titleFilterInput.value;
  state.year = yearFilterSelect.value;
  state.genre = genreFilterSelect.value;
  state.rating = ratingFilterSelect.value;
  state.suggestor = suggestorFilterSelect.value;
  updateClearActionVisibility();
}

function hasActiveFilters() {
  return Boolean(
    state.title.trim()
      || state.year !== "all"
      || state.genre !== "all"
      || state.rating !== "all"
      || state.suggestor !== "all"
  );
}

function updateClearActionVisibility() {
  clearFiltersButton.hidden = !hasActiveFilters();
}

function bindControl(control, onChange) {
  control.addEventListener("input", onChange);
  control.addEventListener("change", onChange);
}

function resetFilters() {
  titleFilterInput.value = "";
  yearFilterSelect.value = "all";
  genreFilterSelect.value = "all";
  ratingFilterSelect.value = "all";
  suggestorFilterSelect.value = "all";
  syncStateFromControls();
  state.sortField = "rating";
  state.sortDirection = "desc";
  updateSortHeaderIndicators();
  renderMovies();
}

function initializeControls() {
  const years = Array.from(
    new Set((MOVIE_DATA.movies || []).map((movie) => String(movie.year)).filter(Boolean))
  ).sort((left, right) => Number(right) - Number(left));

  populateSelect(
    yearFilterSelect,
    years.map((value) => ({ value, label: value })),
    "Year"
  );

  populateSelect(
    genreFilterSelect,
    Object.entries(MOVIE_DATA.genres).map(([value, label]) => ({ value, label }))
  );
  populateSelect(
    suggestorFilterSelect,
    Object.entries(MOVIE_DATA.suggestors).map(([value, label]) => ({ value, label }))
  );

  ratingFilterSelect.innerHTML = "";
  [
    ["all", "All ratings"],
    ["rated", "Rated only"],
    ["unrated", "Unrated only"],
    ["positive", "Positive ratings"],
    ["negative", "Negative ratings"],
    ["zero", "Exactly 0.0"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    ratingFilterSelect.appendChild(option);
  });
  ratingFilterSelect.value = state.rating;

  bindControl(titleFilterInput, () => {
    syncStateFromControls();
    renderMovies();
  });
  bindControl(yearFilterSelect, () => {
    syncStateFromControls();
    renderMovies();
  });
  bindControl(genreFilterSelect, () => {
    syncStateFromControls();
    renderMovies();
  });
  bindControl(ratingFilterSelect, () => {
    syncStateFromControls();
    renderMovies();
  });
  bindControl(suggestorFilterSelect, () => {
    syncStateFromControls();
    renderMovies();
  });

  for (const button of sortHeaderButtons) {
    button.addEventListener("click", () => {
      const field = button.dataset.sortField;
      if (field) {
        setSort(field);
      }
    });
  }

  clearFiltersButton.addEventListener("click", resetFilters);
}

function boot() {
  initializeControls();
  syncStateFromControls();
  updateSortHeaderIndicators();
  renderMovies();
}

try {
  boot();
} catch (error) {
  movieRows.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="movie-subtext">${escapeHtml(error.message)}</div>
      </td>
    </tr>
  `;
}