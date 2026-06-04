const SCHEDULE_TAB_NAME = "schedule";
const SCHEDULE_DATA = Array.isArray(window.MOVIE_DATA?.movies)
  ? window.MOVIE_DATA.movies
  : [];

const scheduleState = {
  activeDate: null,
  activeCalendarMonth: null,
};

const scheduleDom = {
  heroDate: document.getElementById("scheduleHeroDate"),
  heroDay: document.getElementById("scheduleHeroDay"),
  heroCount: document.getElementById("scheduleHeroCount"),
  heroMovies: document.getElementById("scheduleHeroMovies"),
  monthLabel: document.getElementById("scheduleMonthLabel"),
  calendarGrid: document.getElementById("scheduleCalendarGrid"),
  todayButton: document.getElementById("scheduleToday"),
  previousMovieButton: document.getElementById("schedulePreviousMovie"),
  nextMovieButton: document.getElementById("scheduleNextMovie"),
  previousMonthButton: document.getElementById("schedulePreviousMonth"),
  nextMonthButton: document.getElementById("scheduleNextMonth"),
};

const scheduleDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const scheduleMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const scheduleWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

const scheduleEntries = normalizeScheduleEntries(SCHEDULE_DATA);
const scheduleEntriesByDate = groupScheduleEntriesByDate(scheduleEntries);
const scheduledDates = Array.from(scheduleEntriesByDate.keys()).sort();
const todayKey = toDateKey(new Date());
let scheduleInitialized = false;
let scheduleListenersBound = false;

function isScheduleTabActive() {
  return window.location.hash.replace(/^#/, "") === SCHEDULE_TAB_NAME;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthKeyFromDateKey(dateKey) {
  const [year, month] = dateKey.split("-");
  return `${year}-${month}-01`;
}

function addMonths(dateKey, delta) {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

function formatDate(dateKey) {
  return scheduleDateFormatter.format(parseDateKey(dateKey));
}

function formatMonth(dateKey) {
  return scheduleMonthFormatter.format(parseDateKey(dateKey));
}

function formatWeekday(dateKey) {
  return scheduleWeekdayFormatter.format(parseDateKey(dateKey));
}

function getGenreLabel(genreKey) {
  return window.MOVIE_DATA?.genres?.[genreKey] ?? genreKey;
}

function normalizeScheduleEntries(entries) {
  return entries
    .flatMap((entry, index) => {
      if (Array.isArray(entry.episodes) && entry.episodes.length > 0) {
        return entry.episodes.map((episode, episodeIndex) => ({
          plannedDate: episode.plannedDate,
          title: `${entry.title} - ${episode.title}`,
          posterUrl: episode.posterUrl || entry.posterUrl,
          genre: entry.genre,
          rating: parseRating(episode.rating),
          suggestorLabels: Array.isArray(entry.suggestors) ? entry.suggestors.map(getSuggestorLabel) : [],
          sortIndex: index * 100 + episodeIndex,
        }));
      }

      const plannedDates = Array.isArray(entry.plannedDate)
        ? entry.plannedDate
        : entry.plannedDate
          ? [entry.plannedDate]
          : [];

      return plannedDates
        .filter(Boolean)
        .map((plannedDate, plannedDateIndex) => ({
          plannedDate,
          title: entry.title,
          posterUrl: entry.posterUrl,
          genre: entry.genre,
          rating: parseRating(entry.rating),
          suggestorLabels: Array.isArray(entry.suggestors) ? entry.suggestors.map(getSuggestorLabel) : [],
          sortIndex: index * 100 + plannedDateIndex,
        }));
    })
    .filter((entry) => Boolean(entry.plannedDate) && Boolean(entry.title) && Boolean(entry.genre))
    .sort((left, right) => {
      return left.plannedDate.localeCompare(right.plannedDate)
        || left.title.localeCompare(right.title)
        || left.genre.localeCompare(right.genre)
        || left.sortIndex - right.sortIndex;
    });
}

function groupScheduleEntriesByDate(entries) {
  const grouped = new Map();

  for (const entry of entries) {
    if (!grouped.has(entry.plannedDate)) {
      grouped.set(entry.plannedDate, []);
    }

    grouped.get(entry.plannedDate).push(entry);
  }

  for (const entriesForDate of grouped.values()) {
    entriesForDate.sort((left, right) => left.title.localeCompare(right.title) || left.genre.localeCompare(right.genre));
  }

  return grouped;
}

function findInitialActiveDate() {
  if (!scheduledDates.length) {
    return todayKey;
  }

  if (scheduleEntriesByDate.has(todayKey)) {
    return todayKey;
  }

  const upcomingDate = scheduledDates.find((dateKey) => dateKey >= todayKey);
  return upcomingDate || scheduledDates[scheduledDates.length - 1];
}

function findAdjacentScheduledDate(currentDateKey, direction) {
  if (!scheduledDates.length) {
    return null;
  }

  if (direction > 0) {
    return scheduledDates.find((dateKey) => dateKey > currentDateKey) || scheduledDates[scheduledDates.length - 1];
  }

  for (let index = scheduledDates.length - 1; index >= 0; index -= 1) {
    if (scheduledDates[index] < currentDateKey) {
      return scheduledDates[index];
    }
  }

  return scheduledDates[0];
}

function ensureInitialized() {
  if (scheduleInitialized) {
    return;
  }

  scheduleState.activeDate = findInitialActiveDate();
  scheduleState.activeCalendarMonth = monthKeyFromDateKey(scheduleState.activeDate);
  scheduleInitialized = true;
}

function setActiveDate(dateKey, options = {}) {
  if (!dateKey) {
    return;
  }

  const { syncMonth = true } = options;
  scheduleState.activeDate = dateKey;

  if (syncMonth) {
    scheduleState.activeCalendarMonth = monthKeyFromDateKey(dateKey);
  }

  if (isScheduleTabActive()) {
    renderSchedule();
  }
}

function setActiveCalendarMonth(dateKey) {
  scheduleState.activeCalendarMonth = monthKeyFromDateKey(dateKey);

  if (isScheduleTabActive()) {
    renderCalendar();
  }
}

function goToAdjacentScheduleDate(direction) {
  ensureInitialized();
  const nextDate = findAdjacentScheduledDate(scheduleState.activeDate, direction);

  if (nextDate) {
    setActiveDate(nextDate, { syncMonth: true });
  }
}

function goToAdjacentMonth(direction) {
  ensureInitialized();
  setActiveCalendarMonth(addMonths(scheduleState.activeCalendarMonth, direction));
}

function renderHero() {
  const entries = scheduleEntriesByDate.get(scheduleState.activeDate) || [];

  if (scheduleDom.heroDate) {
    scheduleDom.heroDate.textContent = formatDate(scheduleState.activeDate);
  }

  if (scheduleDom.heroDay) {
    scheduleDom.heroDay.textContent = formatWeekday(scheduleState.activeDate);
  }

  if (scheduleDom.heroCount) {
    scheduleDom.heroCount.textContent = String(entries.length);
  }

  if (!scheduleDom.heroMovies) {
    return;
  }

  if (!entries.length) {
    scheduleDom.heroMovies.innerHTML = `
      <article class="schedule-item schedule-item--placeholder" aria-label="No movies planned for this date">
        <div class="schedule-item__poster schedule-item__poster--blank" aria-hidden="true"></div>
        <div class="schedule-item__body">
          <div class="schedule-item__pills">
            <span class="schedule-item__category">Open date</span>
          </div>
          <h3 class="schedule-item__title">No movies planned</h3>
          <div class="rating-block" aria-hidden="true" style="opacity: 0.35">
            <div class="rating-meta">
              ${createTenStarMeter(0).replace('rating-stars"', 'rating-stars rating-stars--compact"')}
              <span class="rating-value rating-value--unrated" style="color: var(--muted-strong)">—/10</span>
            </div>
          </div>
        </div>
      </article>
    `;
    return;
  }

  scheduleDom.heroMovies.innerHTML = entries.map((entry) => {
    const posterMarkup = entry.posterUrl
      ? `<img class="schedule-item__poster" src="${entry.posterUrl}" alt="${escapeHtml(entry.title)} poster">`
      : `<div class="schedule-item__poster schedule-item__poster--blank" aria-hidden="true"></div>`;

    const genreColor = getGenreColor(entry.genre);
    
    let ratingMarkup = '';
    if (entry.rating.kind === "unrated") {
      ratingMarkup = `
        <div class="rating-block">
          <div class="rating-meta">
            ${createTenStarMeter(0).replace('rating-stars"', 'rating-stars rating-stars--compact"')}
            <span class="rating-value rating-value--unrated" style="color: var(--muted-strong)">—/10</span>
          </div>
        </div>
      `;
    } else {
      ratingMarkup = `
        <div class="rating-block">
          <div class="rating-meta">
            ${createTenStarMeter(entry.rating.value).replace('rating-stars"', 'rating-stars rating-stars--compact"')}
            <span class="rating-value${entry.rating.kind === "negative" ? " rating-value--negative" : ""}">${entry.rating.value.toFixed(1)}/10</span>
          </div>
        </div>
      `;
    }

    const suggestorsMarkup = entry.suggestorLabels.map(s => `<span class="suggestor-pill">${escapeHtml(s)}</span>`).join('');

    return `
      <article class="schedule-item" style="border-color: color-mix(in srgb, ${genreColor} 30%, transparent)">
        ${posterMarkup}
        <div class="schedule-item__body">
          <div class="schedule-item__pills">
            <span class="genre-pill" style="--genre-color: ${genreColor}">${escapeHtml(getGenreLabel(entry.genre))}</span>
            ${suggestorsMarkup}
          </div>
          <h3 class="schedule-item__title">${escapeHtml(entry.title)}</h3>
          ${ratingMarkup}
        </div>
      </article>
    `;
  }).join("");
}

function renderCalendar() {
  if (!scheduleDom.monthLabel || !scheduleDom.calendarGrid) {
    return;
  }

  const activeMonthDate = parseDateKey(scheduleState.activeCalendarMonth);
  const monthIndex = activeMonthDate.getMonth();
  const year = activeMonthDate.getFullYear();
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startOfGrid = new Date(year, monthIndex, 1 - firstDayOfMonth.getDay());
  const fragment = document.createDocumentFragment();

  scheduleDom.monthLabel.textContent = formatMonth(scheduleState.activeCalendarMonth);
  scheduleDom.calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(startOfGrid);
    cellDate.setDate(startOfGrid.getDate() + index);

    const dateKey = toDateKey(cellDate);
    const count = scheduleEntriesByDate.get(dateKey)?.length || 0;
    const isCurrentMonth = cellDate.getMonth() === monthIndex;
    const isSelected = dateKey === scheduleState.activeDate;
    const isToday = dateKey === todayKey;

    const cellButton = document.createElement("button");
    cellButton.type = "button";
    cellButton.className = "schedule-calendar__cell";
    cellButton.dataset.scheduleDate = dateKey;
    cellButton.setAttribute("aria-label", `${formatDate(dateKey)}${count ? `, ${count} scheduled movie${count === 1 ? "" : "s"}` : ", no scheduled movies"}`);

    if (!isCurrentMonth) {
      cellButton.classList.add("schedule-calendar__cell--outside");
    }

    if (isSelected) {
      cellButton.classList.add("schedule-calendar__cell--selected");
    }

    if (isToday) {
      cellButton.classList.add("schedule-calendar__cell--today");
    }

    if (count === 1) {
      cellButton.classList.add("schedule-calendar__cell--activity-low");
    } else if (count > 1) {
      cellButton.classList.add("schedule-calendar__cell--activity-high");
    } else {
      cellButton.classList.add("schedule-calendar__cell--empty");
    }

    cellButton.innerHTML = `
      <span class="schedule-calendar__day-number">${cellDate.getDate()}</span>
    `;

    fragment.appendChild(cellButton);
  }

  scheduleDom.calendarGrid.appendChild(fragment);
}

function renderSchedule() {
  ensureInitialized();
  renderHero();
  renderCalendar();
}

function handleCalendarClick(event) {
  const targetButton = event.target.closest("[data-schedule-date]");

  if (!targetButton || targetButton.disabled) {
    return;
  }

  setActiveDate(targetButton.dataset.scheduleDate, { syncMonth: true });
}

function bindScheduleEvents() {
  if (scheduleListenersBound) {
    return;
  }

  scheduleDom.todayButton?.addEventListener("click", () => {
    setActiveDate(todayKey, { syncMonth: true });
  });
  scheduleDom.previousMovieButton?.addEventListener("click", () => goToAdjacentScheduleDate(-1));
  scheduleDom.nextMovieButton?.addEventListener("click", () => goToAdjacentScheduleDate(1));
  scheduleDom.previousMonthButton?.addEventListener("click", () => goToAdjacentMonth(-1));
  scheduleDom.nextMonthButton?.addEventListener("click", () => goToAdjacentMonth(1));
  scheduleDom.calendarGrid?.addEventListener("click", handleCalendarClick);

  window.addEventListener("dashboard:tabchange", (event) => {
    if (event.detail?.tabName === SCHEDULE_TAB_NAME) {
      renderSchedule();
    }
  });

  scheduleListenersBound = true;
}

function initializeScheduleIfVisible() {
  if (!isScheduleTabActive()) {
    return;
  }

  ensureInitialized();
  renderSchedule();
}

bindScheduleEvents();
initializeScheduleIfVisible();
