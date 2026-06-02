// We will fetch the configuration from firebase-config.json
let db = null;

document.addEventListener('DOMContentLoaded', async () => {
    const listEl = document.getElementById('votingMoviesList');
    const nameInput = document.getElementById('votingUserName');
    
    if (!listEl || !nameInput) return;

    // Fetch config
    try {
        if (window.location.protocol === 'file:') {
            throw new Error("You are opening this file directly via the file:// protocol. Browsers block local file fetching for security. Please run a local web server (e.g. VS Code Live Server, 'python -m http.server', or 'npx serve') to test this locally.");
        }
        const response = await fetch('firebase-config.json');
        if (response.ok) {
            const firebaseConfig = await response.json();
            if (firebaseConfig && firebaseConfig.apiKey) {
                firebase.initializeApp(firebaseConfig);
                db = firebase.database();
            }
        } else {
            console.warn("firebase-config.json returned status", response.status);
        }
    } catch (e) {
        console.warn("Could not load Firebase config:", e.message);
        window.FIREBASE_LOAD_ERROR = e.message;
    }

    // Retrieve previous name if any
    const savedName = localStorage.getItem('whisper_voter_name');
    if (savedName) {
        nameInput.value = savedName;
    }

    const allVotes = {};

    function updateAllHighlights() {
        const userName = nameInput.value.trim();
        document.querySelectorAll('.voting-item').forEach(article => {
            const itemId = article.getAttribute('data-id');
            const data = allVotes[itemId] || {};
            const parent = article.querySelector('.voting-scores');
            if (parent) {
                parent.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('vote-btn--selected'));
                if (userName && data[userName] !== undefined) {
                    const btn = parent.querySelector(`.vote-btn[data-score="${data[userName]}"]`);
                    if (btn) btn.classList.add('vote-btn--selected');
                }
            }
        });
    }

    nameInput.addEventListener('input', (e) => {
        localStorage.setItem('whisper_voter_name', e.target.value.trim());
        updateAllHighlights();
    });

    // 1. Gather all voting items based on VOTING_DAYS
    const votingItems = [];
    window.MOVIE_DATA.movies.forEach((movie, mIdx) => {
        if (movie.episodes) {
            movie.episodes.forEach((ep, eIdx) => {
                if (window.VOTING_DAYS.includes(ep.plannedDate)) {
                    votingItems.push({
                        id: `m${mIdx}_e${eIdx}`,
                        title: `${movie.title}: ${ep.title}`,
                        posterUrl: movie.posterUrl
                    });
                }
            });
        } else if (movie.plannedDate) {
            const matches = movie.plannedDate.some(d => window.VOTING_DAYS.includes(d));
            if (matches) {
                votingItems.push({
                    id: `m${mIdx}`,
                    title: movie.title,
                    posterUrl: movie.posterUrl
                });
            }
        }
    });

    // 2. Render UI
    if (votingItems.length === 0) {
        listEl.innerHTML = `<p class="controls-panel__hint">No movies scheduled for the current voting days.</p>`;
        return;
    }

    const scores = [-1, 0, 1, 2, 3, 4, 5];

    listEl.innerHTML = votingItems.map(item => `
        <article class="voting-item" data-id="${item.id}">
            <img src="${item.posterUrl || ''}" alt="${item.title}" class="voting-item__poster" onerror="this.style.display='none'">
            <div class="voting-item__content">
                <h3 class="voting-item__title">${item.title}</h3>
                
                <div class="voting-item__actions">
                    <span class="voting-item__label">Your Vote:</span>
                    <div class="voting-scores">
                        ${scores.map(s => `
                            <button class="vote-btn" data-movie-id="${item.id}" data-score="${s}">${s}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="voting-item__results">
                    <span class="voting-item__label">Live Results:</span>
                    <div class="voting-results-list" id="results-${item.id}">
                        <span class="controls-panel__hint">Waiting for database...</span>
                    </div>
                </div>
            </div>
        </article>
    `).join('');

    // If Firebase isn't configured, show a warning
    if (!db) {
        const errorMsg = window.FIREBASE_LOAD_ERROR || "Firebase not configured. Please create public/firebase-config.json";
        document.querySelectorAll('.voting-results-list').forEach(el => {
            el.innerHTML = `<span style="color:#f08d70; font-size: 0.85rem; line-height: 1.4; display: block;">${errorMsg}</span>`;
        });
        return;
    }

    // 3. Setup interactions and real-time listeners
    const sessionId = window.VOTING_SESSION_ID || "default-session";
    const sessionRef = db.ref(`sessions/${sessionId}/votes`);

    // Handle voting click
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userName = nameInput.value.trim();
            if (!userName) {
                alert("Please enter your name first!");
                nameInput.focus();
                return;
            }

            const movieId = e.target.getAttribute('data-movie-id');
            const score = parseInt(e.target.getAttribute('data-score'), 10);

            // Save to Firebase
            sessionRef.child(movieId).child(userName).set(score).then(() => {
                // visual feedback
                const parent = e.target.closest('.voting-scores');
                parent.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('vote-btn--selected'));
                e.target.classList.add('vote-btn--selected');
            });
        });
    });

    // Listen for real-time updates
    votingItems.forEach(item => {
        const itemRef = sessionRef.child(item.id);
        const resultsEl = document.getElementById(`results-${item.id}`);

        itemRef.on('value', (snapshot) => {
            const data = snapshot.val();
            allVotes[item.id] = data || {};
            updateAllHighlights();

            if (!data) {
                resultsEl.innerHTML = `<span class="controls-panel__hint">No votes yet.</span>`;
                return;
            }

            const voters = Object.keys(data);
            let avg = 0;
            let sum = 0;
            let html = '';

            voters.forEach(voter => {
                const s = data[voter];
                sum += s;
                html += `<div class="voter-chip"><span class="voter-name">${voter}</span> <span class="voter-score" data-score="${s}">${s}</span></div>`;
            });

            let num = (sum * 20) / voters.length;
            let truncatedAvg = Math.trunc(num) / 10;
            avg = truncatedAvg.toFixed(1);

            resultsEl.innerHTML = `
                <div class="voting-summary">Average: <strong>${avg}</strong> (${voters.length} votes)</div>
                <div class="voter-chips">${html}</div>
            `;
        });
    });
});
