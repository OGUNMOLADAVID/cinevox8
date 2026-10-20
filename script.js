/* =========================================================
   CINEVOX script
   1. Catalog data  2. State & helpers   3. Rendering
   4. Filtering     5. Watchlist         6. Dialogs
   7. Events        8. Init
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Catalog data ---------- */
  const STORAGE_KEY = 'cinevox.watchlist';
  const FEATURED_ID = 'dune-part-two';
  const GENRES = ['Action', 'Comedy', 'Animation', 'Sci-Fi', 'Horror', 'Romance', 'Drama', 'Fantasy'];
  const TYPES = { all: 'All titles', movie: 'Movies', series: 'TV Series', anime: 'Anime' };
  const TYPE_NAMES = { movie: 'Movie', series: 'TV Series', anime: 'Anime' };
  const SORT_NAMES = { rating: 'rating', newest: 'newest first', oldest: 'oldest first' };

  // Optional real poster images. Add a file to /images/posters and map it here by id, e.g.
  //   'dune-part-two': 'images/posters/dune-part-two.jpg'
  // Any title not listed gets a generated placeholder poster (title + year on a coloured card).
  const POSTERS = {};

  function posterSVG(title, year, genres) {
    let h = 0;
    for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = h % 360;
    const lines = [];
    let cur = '';
    title.split(' ').forEach((w) => {
      if (cur && (cur + ' ' + w).length > 13) { lines.push(cur); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    const size = lines.length > 3 ? 30 : 38;
    const gap = size + 8;
    const startY = 300 - ((lines.length - 1) * gap) / 2;
    const text = lines.map((l, i) =>
      '<text x="200" y="' + (startY + i * gap) + '" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="' + size + '" fill="#fff">' + esc(l) + '</text>'
    ).join('');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ',55%,32%)"/><stop offset="1" stop-color="hsl(' + ((hue + 50) % 360) + ',60%,12%)"/>' +
      '</linearGradient></defs><rect width="400" height="600" fill="url(#g)"/>' + text +
      '<text x="200" y="548" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#ffffffb3">' + year + ' · ' + esc(genres[0]) + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  // One catalog entry. cast is a list of [actor, character] pairs.
  // trailerId is an optional YouTube video ID; without one, the trailer button links to a YouTube search.
  function item(id, title, type, year, rating, genres, trending, synopsis, cast) {
    const poster = POSTERS[id] || posterSVG(title, year, genres);
    return {
      id, title, type, year, rating, genres, trending, synopsis,
      poster,
      backdrop: poster,
      trailerId: '',
      cast: cast.map((c) => ({ name: c[0], role: c[1] }))
    };
  }

  // Ratings are approximate, rounded from public audience scores.
  const CATALOG = [
    // ----- Movies -----
    item('dune-part-two', 'Dune: Part Two', 'movie', 2024, 8.5, ['Sci-Fi', 'Action'], true, "Paul Atreides joins the Fremen on Arrakis and wages war on the empire that destroyed his family, while his visions of the future grow darker.", [['Timothée Chalamet', 'Paul Atreides'], ['Zendaya', 'Chani'], ['Rebecca Ferguson', 'Lady Jessica'], ['Javier Bardem', 'Stilgar']]),
    item('oppenheimer', 'Oppenheimer', 'movie', 2023, 8.3, ['Drama'], true, "Physicist J. Robert Oppenheimer leads the Manhattan Project to build the atomic bomb, then faces the political fallout and personal cost of what he created.", [['Cillian Murphy', 'J. Robert Oppenheimer'], ['Emily Blunt', 'Kitty Oppenheimer'], ['Matt Damon', 'Leslie Groves'], ['Robert Downey Jr.', 'Lewis Strauss']]),
    item('mad-max-fury-road', 'Mad Max: Fury Road', 'movie', 2015, 8.1, ['Action', 'Sci-Fi'], true, "In a desert wasteland, Max is dragged into a high-speed escape as Imperator Furiosa helps a group of women flee a tyrant warlord.", [['Tom Hardy', 'Max Rockatansky'], ['Charlize Theron', 'Imperator Furiosa'], ['Nicholas Hoult', 'Nux'], ['Hugh Keays-Byrne', 'Immortan Joe']]),
    item('barbie', 'Barbie', 'movie', 2023, 6.8, ['Comedy', 'Fantasy'], true, "After an identity crisis in Barbie Land, Barbie travels to the real world with Ken to find out what it means to be human.", [['Margot Robbie', 'Barbie'], ['Ryan Gosling', 'Ken'], ['America Ferrera', 'Gloria'], ['Kate McKinnon', 'Weird Barbie']]),
    item('inside-out-2', 'Inside Out 2', 'movie', 2024, 7.6, ['Animation', 'Comedy'], true, "As Riley turns thirteen, new emotions such as Anxiety arrive at headquarters and clash with Joy over who she should become.", [['Amy Poehler', 'Joy'], ['Maya Hawke', 'Anxiety'], ['Kensington Tallman', 'Riley'], ['Liza Lapira', 'Disgust']]),
    item('spider-man-across-the-spider-verse', 'Spider-Man: Across the Spider-Verse', 'movie', 2023, 8.4, ['Animation', 'Action'], true, "Miles Morales is swept across the multiverse, meets a society of Spider-People and clashes with them over how to save the people he loves.", [['Shameik Moore', 'Miles Morales'], ['Hailee Steinfeld', 'Gwen Stacy'], ['Oscar Isaac', "Miguel O'Hara"], ['Jake Johnson', 'Peter B. Parker']]),
    item('spirited-away', 'Spirited Away', 'movie', 2001, 8.6, ['Animation', 'Fantasy'], true, "A ten-year-old girl wanders into a world of spirits and must work in a bathhouse for the gods to free her parents, who have been turned into pigs.", [['Rumi Hiiragi', 'Chihiro'], ['Miyu Irino', 'Haku'], ['Mari Natsuki', 'Yubaba'], ['Takashi Naito', 'Kamaji']]),
    item('the-dark-knight', 'The Dark Knight', 'movie', 2008, 9.0, ['Action', 'Drama'], true, "Batman, Lieutenant Gordon and district attorney Harvey Dent set out to dismantle Gotham's crime syndicates, until the Joker pushes the city into chaos.", [['Christian Bale', 'Bruce Wayne / Batman'], ['Heath Ledger', 'The Joker'], ['Aaron Eckhart', 'Harvey Dent'], ['Gary Oldman', 'James Gordon']]),
    item('everything-everywhere-all-at-once', 'Everything Everywhere All at Once', 'movie', 2022, 7.8, ['Sci-Fi', 'Comedy', 'Action'], true, "An overwhelmed laundromat owner is pulled into the multiverse, where she must connect with other versions of herself to stop a threat to all of reality.", [['Michelle Yeoh', 'Evelyn Wang'], ['Stephanie Hsu', 'Joy Wang'], ['Ke Huy Quan', 'Waymond Wang'], ['Jamie Lee Curtis', 'Deirdre Beaubeirdre']]),
    item('interstellar', 'Interstellar', 'movie', 2014, 8.7, ['Sci-Fi', 'Drama'], false, "With Earth's crops failing, a former pilot joins a mission through a wormhole to search for a new home for humanity.", [['Matthew McConaughey', 'Cooper'], ['Anne Hathaway', 'Brand'], ['Jessica Chastain', 'Murph'], ['Michael Caine', 'Professor Brand']]),
    item('get-out', 'Get Out', 'movie', 2017, 7.8, ['Horror'], false, "A young photographer visits his girlfriend's family for a weekend in the country and slowly uncovers a disturbing secret.", [['Daniel Kaluuya', 'Chris Washington'], ['Allison Williams', 'Rose Armitage'], ['Catherine Keener', 'Missy Armitage'], ['Bradley Whitford', 'Dean Armitage']]),
    item('la-la-land', 'La La Land', 'movie', 2016, 8.0, ['Romance', 'Drama'], false, "An aspiring actress and a jazz pianist fall in love in Los Angeles while chasing their dreams.", [['Ryan Gosling', 'Sebastian'], ['Emma Stone', 'Mia'], ['John Legend', 'Keith'], ['Rosemarie DeWitt', 'Laura']]),
    item('coco', 'Coco', 'movie', 2017, 8.4, ['Animation', 'Fantasy'], false, "A boy who dreams of being a musician enters the Land of the Dead to uncover why his family banned music.", [['Anthony Gonzalez', 'Miguel'], ['Gael García Bernal', 'Héctor'], ['Benjamin Bratt', 'Ernesto de la Cruz'], ['Alanna Ubach', 'Mamá Imelda']]),
    item('john-wick', 'John Wick', 'movie', 2014, 7.4, ['Action'], false, "A retired hitman comes out of retirement to hunt the gangsters who killed his dog and stole his car.", [['Keanu Reeves', 'John Wick'], ['Michael Nyqvist', 'Viggo Tarasov'], ['Alfie Allen', 'Iosef Tarasov'], ['Willem Dafoe', 'Marcus']]),
    item('the-matrix', 'The Matrix', 'movie', 1999, 8.7, ['Sci-Fi', 'Action'], false, "A hacker learns that reality is a simulation run by machines and joins a rebellion to free humanity.", [['Keanu Reeves', 'Neo'], ['Laurence Fishburne', 'Morpheus'], ['Carrie-Anne Moss', 'Trinity'], ['Hugo Weaving', 'Agent Smith']]),
    item('the-notebook', 'The Notebook', 'movie', 2004, 7.8, ['Romance', 'Drama'], false, "An elderly man reads a love story to a woman with dementia, recounting a summer romance between a young couple divided by class.", [['Ryan Gosling', 'Noah Calhoun'], ['Rachel McAdams', 'Allie Hamilton'], ['James Garner', 'Duke'], ['Gena Rowlands', 'Older Allie']]),
    item('hereditary', 'Hereditary', 'movie', 2018, 7.3, ['Horror'], false, "After the death of their secretive grandmother, a grieving family begins to unravel disturbing secrets about their ancestry.", [['Toni Collette', 'Annie Graham'], ['Alex Wolff', 'Peter Graham'], ['Milly Shapiro', 'Charlie Graham'], ['Gabriel Byrne', 'Steve Graham']]),
    item('a-quiet-place', 'A Quiet Place', 'movie', 2018, 7.5, ['Horror', 'Sci-Fi'], false, "A family lives in near-total silence on a remote farm to avoid blind creatures that hunt by sound.", [['Emily Blunt', 'Evelyn Abbott'], ['John Krasinski', 'Lee Abbott'], ['Millicent Simmonds', 'Regan Abbott'], ['Noah Jupe', 'Marcus Abbott']]),
    item('the-grand-budapest-hotel', 'The Grand Budapest Hotel', 'movie', 2014, 8.1, ['Comedy', 'Drama'], false, "A legendary hotel concierge and his young lobby boy are caught up in the theft of a priceless painting and a feud over a vast inheritance.", [['Ralph Fiennes', 'M. Gustave'], ['Tony Revolori', 'Zero Moustafa'], ['F. Murray Abraham', 'Older Zero'], ['Saoirse Ronan', 'Agatha']]),

    // ----- TV series -----
    item('breaking-bad', 'Breaking Bad', 'series', 2008, 9.5, ['Drama'], true, "A high school chemistry teacher diagnosed with cancer starts making methamphetamine to secure his family's future.", [['Bryan Cranston', 'Walter White'], ['Aaron Paul', 'Jesse Pinkman'], ['Anna Gunn', 'Skyler White'], ['Dean Norris', 'Hank Schrader']]),
    item('stranger-things', 'Stranger Things', 'series', 2016, 8.6, ['Sci-Fi', 'Horror', 'Drama'], true, "When a boy vanishes in a small Indiana town, his friends and family uncover secret experiments and a terrifying supernatural world.", [['Millie Bobby Brown', 'Eleven'], ['Finn Wolfhard', 'Mike Wheeler'], ['Winona Ryder', 'Joyce Byers'], ['David Harbour', 'Jim Hopper']]),
    item('game-of-thrones', 'Game of Thrones', 'series', 2011, 9.2, ['Fantasy', 'Drama', 'Action'], false, "Noble families fight for control of the Iron Throne while an ancient threat gathers beyond the Wall.", [['Emilia Clarke', 'Daenerys Targaryen'], ['Kit Harington', 'Jon Snow'], ['Peter Dinklage', 'Tyrion Lannister'], ['Lena Headey', 'Cersei Lannister']]),
    item('the-office-us', 'The Office (US)', 'series', 2005, 9.0, ['Comedy'], false, "A mockumentary following the everyday lives of the employees at a paper company in Scranton, Pennsylvania.", [['Steve Carell', 'Michael Scott'], ['Rainn Wilson', 'Dwight Schrute'], ['John Krasinski', 'Jim Halpert'], ['Jenna Fischer', 'Pam Beesly']]),
    item('chernobyl', 'Chernobyl', 'series', 2019, 9.3, ['Drama'], false, "A dramatization of the 1986 nuclear disaster and of the people who fought to contain it and uncover the truth.", [['Jared Harris', 'Valery Legasov'], ['Stellan Skarsgård', 'Boris Shcherbina'], ['Emily Watson', 'Ulana Khomyuk'], ['Jessie Buckley', 'Lyudmilla Ignatenko']]),
    item('severance', 'Severance', 'series', 2022, 8.7, ['Sci-Fi', 'Drama'], false, "Employees at a mysterious company undergo a procedure that separates their work memories from their personal lives.", [['Adam Scott', 'Mark Scout'], ['Britt Lower', 'Helly Riggs'], ['Patricia Arquette', 'Harmony Cobel'], ['John Turturro', 'Irving Bailiff']]),

    // ----- Anime -----
    item('attack-on-titan', 'Attack on Titan', 'anime', 2013, 9.1, ['Action', 'Drama', 'Fantasy'], true, "Humanity lives behind enormous walls to survive man-eating giants. When the walls are breached, Eren Yeager vows to destroy every one of them.", [['Yuki Kaji', 'Eren Yeager'], ['Yui Ishikawa', 'Mikasa Ackerman'], ['Marina Inoue', 'Armin Arlert'], ['Hiroshi Kamiya', 'Levi Ackerman']]),
    item('demon-slayer', 'Demon Slayer: Kimetsu no Yaiba', 'anime', 2019, 8.6, ['Action', 'Fantasy'], false, "After his family is slaughtered and his sister is turned into a demon, Tanjiro Kamado trains to become a demon slayer.", [['Natsuki Hanae', 'Tanjiro Kamado'], ['Akari Kitō', 'Nezuko Kamado'], ['Hiro Shimono', 'Zenitsu Agatsuma'], ['Yoshitsugu Matsuoka', 'Inosuke Hashibira']]),
    item('fullmetal-alchemist-brotherhood', 'Fullmetal Alchemist: Brotherhood', 'anime', 2009, 9.1, ['Action', 'Fantasy', 'Drama'], false, "Two brothers search for the Philosopher's Stone to restore their bodies after a failed attempt to bring their mother back with alchemy.", [['Romi Park', 'Edward Elric'], ['Rie Kugimiya', 'Alphonse Elric'], ['Shinichiro Miki', 'Roy Mustang'], ['Fumiko Orikasa', 'Riza Hawkeye']]),
    item('cowboy-bebop', 'Cowboy Bebop', 'anime', 1998, 8.9, ['Action', 'Sci-Fi'], false, "In 2071, a crew of bounty hunters travels the solar system chasing criminals while running from their own pasts.", [['Koichi Yamadera', 'Spike Spiegel'], ['Unshō Ishizuka', 'Jet Black'], ['Megumi Hayashibara', 'Faye Valentine'], ['Aoi Tada', 'Ed']])
  ];

  /*
   * DATA SOURCE: swap this function to load live data later.
   * For example, fetch from a movie API (TMDB, OMDb), map each result to the same fields
   * as item() above, and return the array. The rest of the code stays the same.
   */
  async function getMovies() {
    return CATALOG;
  }

  /* ---------- 2. State & helpers ---------- */
  const DEFAULTS = { query: '', genre: 'all', type: 'all', sort: 'featured', trending: false };
  const state = Object.assign({}, DEFAULTS);
  let catalog = [];
  let watchlist = new Set();
  let toastTimer = null;
  let lastFocus = null;

  const $ = (sel) => document.querySelector(sel);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    menu: $('#menu'), navToggle: $('#nav-toggle'),
    genreToggle: $('#genre-toggle'), genreMenu: $('#genre-menu'),
    search: $('#nav-search'), searchForm: $('#search-form'),
    watchBtn: $('#watchlist-btn'), watchCount: $('#watchlist-count'),
    trendingGrid: $('#trending-grid'), rows: $('#rows'),
    fType: $('#filter-type'), fGenre: $('#filter-genre'), fSort: $('#filter-sort'),
    resultsCount: $('#results-count'), resultsGrid: $('#results-grid'), resultsEmpty: $('#results-empty'),
    resetBtn: $('#results-reset'), emptyReset: $('#empty-reset'),
    watchGrid: $('#watchlist-grid'), watchEmpty: $('#watchlist-empty'),
    detail: $('#detail-dialog'), detailContent: $('#detail-content'),
    trailer: $('#trailer-dialog'), trailerContent: $('#trailer-content'),
    toast: $('#toast')
  };

  // Escape text before putting it into HTML (important once data comes from an API).
  function esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const byId = (id) => catalog.find((m) => m.id === id);
  function scrollToEl(el) { el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  /* ---------- 3. Rendering ---------- */
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  const ICON_BOOKMARK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M6 4h12v17l-6-4-6 4z"/></svg>';
  const ICON_ARROW = (d) => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="' + d + '"/></svg>';

  function cardHTML(m) {
    const saved = watchlist.has(m.id);
    return '<article class="card">' +
      '<button class="card-main" type="button" data-action="open" data-id="' + m.id + '" aria-label="View details for ' + esc(m.title) + '">' +
        '<span class="card-poster">' +
          '<img src="' + esc(m.poster) + '" alt="" width="400" height="600" loading="lazy">' +
          '<span class="card-rating"><span aria-hidden="true">★</span> ' + m.rating.toFixed(1) + '<span class="sr-only"> rating</span></span>' +
          '<span class="card-play" aria-hidden="true">' + ICON_PLAY + '</span>' +
        '</span>' +
        '<span class="card-body">' +
          '<span class="card-title">' + esc(m.title) + '</span>' +
          '<span class="card-meta">' + m.year + ' · ' + esc(m.genres.join(', ')) + '</span>' +
        '</span>' +
      '</button>' +
      '<button class="card-watch" type="button" data-action="watch" data-id="' + m.id + '" data-title="' + esc(m.title) + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Remove ' : 'Add ') + esc(m.title) + (saved ? ' from' : ' to') + ' watchlist">' + ICON_BOOKMARK + '</button>' +
    '</article>';
  }
  const listHTML = (movies) => movies.map((m) => '<li>' + cardHTML(m) + '</li>').join('');

  // Category rows shown as horizontal scrollers. "view" is applied when View All is selected.
  const byRating = (list) => list.slice().sort((a, b) => b.rating - a.rating);
  const ROWS = [
    { id: 'trending-now', title: 'Trending Now', pick: (l) => l.filter((m) => m.trending), view: { trending: true } },
    { id: 'popular', title: 'Popular Movies', pick: (l) => byRating(l.filter((m) => m.type === 'movie')).slice(0, 12), view: { type: 'movie', sort: 'rating' } },
    { id: 'action', title: 'Action', pick: (l) => l.filter((m) => m.genres.includes('Action')), view: { genre: 'Action' } },
    { id: 'comedy', title: 'Comedy', pick: (l) => l.filter((m) => m.genres.includes('Comedy')), view: { genre: 'Comedy' } },
    { id: 'animation', title: 'Animation', pick: (l) => l.filter((m) => m.genres.includes('Animation')), view: { genre: 'Animation' } },
    { id: 'sci-fi', title: 'Sci-Fi', pick: (l) => l.filter((m) => m.genres.includes('Sci-Fi')), view: { genre: 'Sci-Fi' } },
    { id: 'horror', title: 'Horror', pick: (l) => l.filter((m) => m.genres.includes('Horror')), view: { genre: 'Horror' } },
    { id: 'romance', title: 'Romance', pick: (l) => l.filter((m) => m.genres.includes('Romance')), view: { genre: 'Romance' } },
    { id: 'series', title: 'TV Series', pick: (l) => l.filter((m) => m.type === 'series'), view: { type: 'series' } },
    { id: 'anime', title: 'Anime', pick: (l) => l.filter((m) => m.type === 'anime'), view: { type: 'anime' } }
  ];

  function renderRows() {
    els.rows.innerHTML = ROWS.map((row) => {
      const items = row.pick(catalog);
      return '<section class="section" aria-labelledby="' + row.id + '-title"><div class="container">' +
        '<div class="section-head"><h2 id="' + row.id + '-title">' + row.title + '</h2>' +
        '<div class="row-controls">' +
          '<button class="icon-btn" type="button" data-action="row-scroll" data-dir="-1" data-target="track-' + row.id + '" aria-label="Scroll ' + row.title + ' left">' + ICON_ARROW('m15 6-6 6 6 6') + '</button>' +
          '<button class="icon-btn" type="button" data-action="row-scroll" data-dir="1" data-target="track-' + row.id + '" aria-label="Scroll ' + row.title + ' right">' + ICON_ARROW('m9 6 6 6-6 6') + '</button>' +
          '<button class="link-btn" type="button" data-action="view-all" data-row="' + row.id + '">View All</button>' +
        '</div></div>' +
        '<ul class="row-track" id="track-' + row.id + '">' + listHTML(items) + '</ul>' +
      '</div></section>';
    }).join('');
  }

  function renderHero() {
    const m = byId(FEATURED_ID);
    if (!m) return;
    $('#hero-title').textContent = m.title;
    $('#hero-synopsis').textContent = m.synopsis;
    $('#hero-meta').innerHTML = '<li>' + m.year + '</li><li>' + esc(m.genres.join(', ')) + '</li><li class="rating"><span aria-hidden="true">★</span> ' + m.rating.toFixed(1) + '<span class="sr-only"> rating</span></li>';
  }

  function renderTrending() {
    const list = catalog.filter((m) => m.type === 'movie' && m.trending).slice(0, 8);
    els.trendingGrid.innerHTML = listHTML(list);
  }

  /* ---------- 4. Search, filter and sort ---------- */
  function getResults() {
    const q = state.query.toLowerCase();
    const list = catalog.filter((m) =>
      (!q || m.title.toLowerCase().includes(q)) &&
      (state.genre === 'all' || m.genres.includes(state.genre)) &&
      (state.type === 'all' || m.type === state.type) &&
      (!state.trending || m.trending)
    );
    if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (state.sort === 'newest') list.sort((a, b) => b.year - a.year);
    if (state.sort === 'oldest') list.sort((a, b) => a.year - b.year);
    return list;
  }

  function isFiltered() {
    return Object.keys(DEFAULTS).some((k) => state[k] !== DEFAULTS[k]);
  }

  function describeResults(n) {
    const bits = [];
    if (state.trending) bits.push('Trending');
    if (state.type !== 'all') bits.push(TYPES[state.type]);
    if (state.genre !== 'all') bits.push(state.genre);
    if (state.query) bits.push('titles matching “' + state.query + '”');
    if (state.sort !== 'featured') bits.push('sorted by ' + SORT_NAMES[state.sort]);
    return n + (n === 1 ? ' title' : ' titles') + (bits.length ? ': ' + bits.join(', ') : '');
  }

  function renderBrowse() {
    const results = getResults();
    els.resultsGrid.innerHTML = listHTML(results);
    els.resultsGrid.hidden = results.length === 0;
    els.resultsEmpty.hidden = results.length > 0;
    els.resultsCount.textContent = describeResults(results.length);
    els.resetBtn.hidden = !isFiltered();
    els.fType.value = state.type;
    els.fGenre.value = state.genre;
    els.fSort.value = state.sort;
    updateNavState();
  }

  function updateNavState() {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const key = link.dataset.nav;
      const active = key === 'home' ? state.type === 'all' : key === state.type;
      if (active && link.classList.contains('logo') === false) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function applyState(changes, scroll) {
    Object.assign(state, DEFAULTS, changes);
    els.search.value = state.query;
    renderBrowse();
    if (scroll) scrollToEl($('#browse'));
  }

  /* ---------- 5. Watchlist (saved in localStorage) ---------- */
  function loadWatchlist() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) watchlist = new Set(saved);
    } catch (err) { watchlist = new Set(); }
  }
  function saveWatchlist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...watchlist])); }
    catch (err) { showToast('Could not save: browser storage is unavailable.'); }
  }

  function toggleWatch(id) {
    const m = byId(id);
    if (!m) return;
    if (watchlist.has(id)) { watchlist.delete(id); showToast('Removed from watchlist'); }
    else { watchlist.add(id); showToast('Added to watchlist'); }
    saveWatchlist();
    updateWatchUI();
  }

  function updateWatchUI() {
    // Rebuild the watchlist section, then sync every bookmark button on the page.
    const saved = catalog.filter((m) => watchlist.has(m.id));
    els.watchGrid.innerHTML = listHTML(saved);
    els.watchEmpty.hidden = saved.length > 0;
    els.watchCount.textContent = saved.length;
    document.querySelectorAll('[data-action="watch"]').forEach((btn) => {
      const isSaved = watchlist.has(btn.dataset.id);
      const label = btn.querySelector('.watch-label');
      if (label) { label.textContent = isSaved ? 'In your watchlist' : 'Add to watchlist'; }
      else {
        btn.setAttribute('aria-pressed', String(isSaved));
        btn.setAttribute('aria-label', (isSaved ? 'Remove ' : 'Add ') + btn.dataset.title + (isSaved ? ' from' : ' to') + ' watchlist');
      }
    });
  }

  /* ---------- 6. Dialogs: details and trailer ---------- */
  function openDialog(dialog) {
    lastFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  function closeDialogCleanup(dialog) {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    if (dialog === els.trailer) els.trailerContent.innerHTML = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  const ICON_CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>';

  function openDetails(id) {
    const m = byId(id);
    if (!m) return;
    const saved = watchlist.has(m.id);
    els.detailContent.innerHTML =
      '<div class="detail-hero"><img src="' + esc(m.backdrop) + '" alt="">' +
        '<button class="modal-close" type="button" data-action="close" aria-label="Close details">' + ICON_CLOSE + '</button></div>' +
      '<div class="detail-body">' +
        '<img class="detail-poster" src="' + esc(m.poster) + '" alt="Poster for ' + esc(m.title) + '" width="400" height="600">' +
        '<div class="detail-info">' +
          '<h2 id="detail-title">' + esc(m.title) + '</h2>' +
          '<ul class="meta-list"><li>' + m.year + '</li><li>' + TYPE_NAMES[m.type] + '</li><li class="rating"><span aria-hidden="true">★</span> ' + m.rating.toFixed(1) + '<span class="sr-only"> rating</span></li></ul>' +
          '<ul class="chips" aria-label="Genres">' + m.genres.map((g) => '<li>' + esc(g) + '</li>').join('') + '</ul>' +
          '<p class="synopsis">' + esc(m.synopsis) + '</p>' +
          '<h3>Cast</h3>' +
          '<ul class="cast-list">' + m.cast.map((c) => '<li>' + esc(c.name) + '<span>' + esc(c.role) + '</span></li>').join('') + '</ul>' +
          '<div class="detail-actions">' +
            '<button class="btn btn-primary" type="button" data-action="trailer" data-id="' + m.id + '">' + ICON_PLAY.replace('<svg ', '<svg width="18" height="18" ') + ' Watch Trailer</button>' +
            '<button class="btn btn-ghost" type="button" data-action="watch" data-id="' + m.id + '" data-title="' + esc(m.title) + '">' + ICON_BOOKMARK + '<span class="watch-label">' + (saved ? 'In your watchlist' : 'Add to watchlist') + '</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (!els.detail.open) openDialog(els.detail);
  }

  function openTrailer(id) {
    const m = byId(id);
    if (!m) return;
    const body = m.trailerId
      ? '<div class="trailer-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(m.trailerId) + '?rel=0&autoplay=1" title="Trailer for ' + esc(m.title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
      : '<div class="trailer-empty"><p>The trailer opens on YouTube.</p>' +
        '<a class="btn btn-primary" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(m.title + ' ' + m.year + ' official trailer') + '" target="_blank" rel="noopener noreferrer">Search trailer on YouTube</a></div>';
    els.trailerContent.innerHTML =
      '<div class="trailer-body">' +
        '<button class="modal-close" type="button" data-action="close" aria-label="Close trailer">' + ICON_CLOSE + '</button>' +
        '<h2 id="trailer-title">' + esc(m.title) + ' · Trailer</h2>' + body +
      '</div>';
    openDialog(els.trailer);
  }

  /* ---------- 7. Events ---------- */
  function setMenuOpen(open) {
    els.menu.classList.toggle('is-open', open);
    els.navToggle.setAttribute('aria-expanded', String(open));
  }
  function setGenreOpen(open) {
    els.genreMenu.hidden = !open;
    els.genreToggle.setAttribute('aria-expanded', String(open));
  }

  function handleAction(target) {
    const { action, id } = target.dataset;
    if (action === 'open') openDetails(id);
    else if (action === 'trailer') openTrailer(id);
    else if (action === 'watch') toggleWatch(id);
    else if (action === 'close') target.closest('dialog').close();
    else if (action === 'row-scroll') {
      const track = document.getElementById(target.dataset.target);
      track.scrollBy({ left: Number(target.dataset.dir) * track.clientWidth * 0.85, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else if (action === 'view-all') {
      const row = ROWS.find((r) => r.id === target.dataset.row);
      if (row) applyState(row.view, true);
    } else if (action === 'genre') {
      applyState({ genre: target.dataset.genre, type: state.type }, true);
      setGenreOpen(false);
      setMenuOpen(false);
    }
  }

  function bindEvents() {
    // One delegated click handler for cards, rows, dialogs and genre menu.
    document.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) handleAction(actionEl);

      const navLink = e.target.closest('[data-nav]');
      if (navLink) {
        const key = navLink.dataset.nav;
        applyState(key === 'home' ? {} : { type: key }, false);
        setMenuOpen(false);
        if (key === 'home') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }
      }
      if (!e.target.closest('.dropdown')) setGenreOpen(false);
    });

    els.navToggle.addEventListener('click', () => setMenuOpen(!els.menu.classList.contains('is-open')));
    els.genreToggle.addEventListener('click', () => setGenreOpen(els.genreMenu.hidden));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { setGenreOpen(false); setMenuOpen(false); }
    });

    // Search: update results as the person types; scroll to results the first time.
    let hadQuery = false;
    els.search.addEventListener('input', () => {
      state.query = els.search.value.trim();
      renderBrowse();
      if (state.query && !hadQuery) scrollToEl($('#browse'));
      hadQuery = Boolean(state.query);
    });
    els.searchForm.addEventListener('submit', (e) => { e.preventDefault(); scrollToEl($('#browse')); setMenuOpen(false); });

    // Filter dropdowns
    els.fType.addEventListener('change', () => { state.type = els.fType.value; renderBrowse(); });
    els.fGenre.addEventListener('change', () => { state.genre = els.fGenre.value; renderBrowse(); });
    els.fSort.addEventListener('change', () => { state.sort = els.fSort.value; renderBrowse(); });
    const reset = () => { applyState({}, false); hadQuery = false; };
    els.resetBtn.addEventListener('click', reset);
    els.emptyReset.addEventListener('click', reset);

    els.watchBtn.addEventListener('click', () => { scrollToEl($('#watchlist')); setMenuOpen(false); });

    // Dialogs: click on the backdrop closes; restore focus when closed.
    [els.detail, els.trailer].forEach((dialog) => {
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => closeDialogCleanup(dialog));
    });
  }

  /* ---------- 8. Init ---------- */
  async function init() {
    catalog = await getMovies();
    loadWatchlist();

    els.fGenre.innerHTML = '<option value="all">All genres</option>' + GENRES.map((g) => '<option>' + g + '</option>').join('');
    els.genreMenu.innerHTML = GENRES.map((g) => '<li><button type="button" data-action="genre" data-genre="' + g + '">' + g + '</button></li>').join('');

    renderHero();
    renderTrending();
    renderRows();
    renderBrowse();
    updateWatchUI();
    bindEvents();
    $('#year').textContent = new Date().getFullYear();
  }

  init();
})();
