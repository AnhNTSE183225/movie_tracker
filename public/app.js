const SUGGESTOR_DELIMITER = "|";
const INLINE_MOVIE_CSV = window.MOVIE_CSV_TEXT || "";

const movieRows = document.getElementById("movieRows");
const movieCount = document.getElementById("movieCount");
const highestRating = document.getElementById("highestRating");
const topPick = document.getElementById("topPick");
let ratingIdSeed = 0;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell.trim());
      if (row.some((value) => value !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value !== "")) {
      rows.push(row);
    }
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  return dataRows.map((fields) =>
    headers.reduce((record, header, index) => {
      record[header] = (fields[index] ?? "").trim();
      return record;
    }, {})
  );
}

function parseSuggestors(rawSuggestors) {
  return rawSuggestors
    .split(SUGGESTOR_DELIMITER)
    .map((name) => name.trim())
    .filter(Boolean);
}

function parseRating(rawRating) {
  const numericRating = Number.parseFloat(rawRating);

  if (!Number.isFinite(numericRating)) {
    return {
      kind: "unrated",
      value: null,
      sortValue: Number.NEGATIVE_INFINITY,
    };
  }

  return {
    kind: numericRating < 0 ? "negative" : "positive",
    value: numericRating,
    sortValue: numericRating,
  };
}

function buildStarPath(index) {
  const offset = index * 24;
  return `<g transform="translate(${offset} 0)"><path transform="translate(0 0) scale(0.8)" d="M15 1.5l3.53 7.15 7.89 1.15-5.71 5.56 1.35 7.85L15 19.53l-7.06 3.68 1.35-7.85-5.71-5.56 7.89-1.15L15 1.5z"></path></g>`;
}

function createRatingStars(rating) {
  const fillWidth = Math.max(0, Math.min(120, (Math.abs(Number(rating)) / 10) * 120));
  const starPaths = Array.from({ length: 5 }, (_, index) => buildStarPath(index)).join("");
  const clipId = `ratingClip-${ratingIdSeed += 1}`;
  const negativeClass = Number(rating) < 0 ? " rating-stars--negative" : "";

  return `
    <div class="rating-stars${negativeClass}" role="img" aria-label="${Number(rating).toFixed(1)} out of 10">
      <svg viewBox="0 0 120 24" class="rating-stars__svg" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
            <rect x="0" y="0" width="${fillWidth}" height="24"></rect>
          </clipPath>
        </defs>
        <g class="rating-stars__base">${starPaths}</g>
        <g class="rating-stars__fill" clip-path="url(#${clipId})">${starPaths}</g>
      </svg>
    </div>
  `;
}

async function loadMovies() {
  if (!INLINE_MOVIE_CSV) {
    throw new Error("Missing movie data source: movies-data.js");
  }

  const csvText = INLINE_MOVIE_CSV;
  const movies = parseCsv(csvText)
    .map((movie) => ({
      title: movie.Title,
      year: movie.Year,
      genre: movie.Genre,
      rating: parseRating(movie["Rating out of 10"]),
      suggestors: parseSuggestors(movie.Suggestors),
    }))
    .sort((leftMovie, rightMovie) => rightMovie.rating.sortValue - leftMovie.rating.sortValue);

  movieRows.innerHTML = "";

  for (const movie of movies) {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    const title = document.createElement("span");
    title.className = "movie-title";
    title.textContent = movie.title;
    titleCell.appendChild(title);

    const yearCell = document.createElement("td");
    const year = document.createElement("span");
    year.className = "year-pill";
    year.textContent = movie.year;
    yearCell.appendChild(year);

    const genreCell = document.createElement("td");
    const genre = document.createElement("span");
    genre.className = "genre-pill";
    genre.textContent = movie.genre;
    genreCell.appendChild(genre);

    const ratingCell = document.createElement("td");
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
      ratingMeta.innerHTML = createRatingStars(movie.rating.value);

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
    const suggestorsWrap = document.createElement("div");
    suggestorsWrap.className = "suggestors";
    for (const name of movie.suggestors) {
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
  const highestScore = scoredMovies.length > 0 ? scoredMovies[0].rating.value : null;
  const topRatedMovie = movies[0];

  movieCount.textContent = String(totalMovies);
  highestRating.textContent = highestScore === null ? "—" : highestScore.toFixed(1);
  topPick.textContent = topRatedMovie.title;
  document.body.dataset.moviesReady = "true";
}

loadMovies().catch((error) => {
  movieRows.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="movie-subtext">${escapeHtml(error.message)}</div>
      </td>
    </tr>
  `;
});