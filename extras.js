/* CINEVOX extras: theme, languages, profile, comments, age filter */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const ls = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---- Languages: English | French | Spanish (UI text; titles stay as released) ---- */
  const D = {};
  `Home|Accueil|Inicio
Movies|Films|Películas
TV Series|Séries TV|Series de TV
Genres|Genres|Géneros
Watchlist|Ma liste|Mi lista
My Watchlist|Ma liste|Mi lista
Search titles|Rechercher un titre|Buscar títulos
Your Next World Is Playing.|Votre prochain monde se joue maintenant.|Tu próximo mundo se está reproduciendo.
View details|Voir les détails|Ver detalles
Watch Trailer|Voir la bande-annonce|Ver tráiler
Trending Movies|Films tendance|Películas en tendencia
Browse all titles|Parcourir tous les titres|Explorar todos los títulos
Type|Type|Tipo
Genre|Genre|Género
Sort by|Trier par|Ordenar por
Age rating|Classification d'âge|Clasificación por edad
All ratings|Toutes classifications|Todas las clasificaciones
All titles|Tous les titres|Todos los títulos
Featured|En vedette|Destacados
Rating: high to low|Note : de la plus haute à la plus basse|Valoración: de mayor a menor
Release year: newest|Année : la plus récente|Año: más reciente
Release year: oldest|Année : la plus ancienne|Año: más antiguo
Clear filters|Effacer les filtres|Borrar filtros
All genres|Tous les genres|Todos los géneros
No titles match your search|Aucun titre ne correspond à votre recherche|Ningún título coincide con tu búsqueda
Clear search and filters|Effacer la recherche et les filtres|Borrar búsqueda y filtros
About Us|À propos|Sobre nosotros
Contact|Contact|Contacto
Privacy Policy|Politique de confidentialité|Política de privacidad
Terms of Service|Conditions d'utilisation|Términos del servicio
Follow us|Suivez-nous|Síguenos
Cast|Distribution|Reparto
Add to watchlist|Ajouter à ma liste|Añadir a mi lista
In your watchlist|Dans votre liste|En tu lista
Comments|Commentaires|Comentarios
Your name|Votre nom|Tu nombre
Write a comment…|Écrivez un commentaire…|Escribe un comentario…
Post comment|Publier|Publicar
No comments yet. Be the first!|Aucun commentaire. Soyez le premier !|Aún no hay comentarios. ¡Sé el primero!
Comments are saved in this browser only.|Les commentaires sont enregistrés dans ce navigateur uniquement.|Los comentarios se guardan solo en este navegador.
Profile|Profil|Perfil
Create your profile|Créez votre profil|Crea tu perfil
Your age|Votre âge|Tu edad
Your age sets the age-rating filter automatically.|Votre âge règle automatiquement le filtre de classification.|Tu edad ajusta automáticamente el filtro de clasificación.
Save profile|Enregistrer le profil|Guardar perfil
Delete profile|Supprimer le profil|Eliminar perfil
Close|Fermer|Cerrar`.split('\n').forEach((l) => { const p = l.split('|'); D[p[0]] = { fr: p[1], es: p[2] }; });

  let lang = ls.get('cinevox.lang', 'en');
  function one(n) {
    const raw = n.nodeValue, en = n._en || raw.trim();
    if (!en) return;
    const o = lang === 'en' ? (n._en ? en : null) : (D[en] && D[en][lang]);
    if (!o) return;
    n._en = en;
    n.nodeValue = raw.replace(raw.trim(), () => o);
  }
  function tr(root) {
    if (root.nodeType === 3) return one(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) one(n);
    root.querySelectorAll('[placeholder]').forEach((e) => {
      const en = e._ph || e.placeholder, o = lang === 'en' ? en : (D[en] || {})[lang];
      if (o) { e._ph = en; e.placeholder = o; }
    });
  }
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(tr))).observe(document.body, { childList: true, subtree: true });

  /* ---- Nav controls: language, theme, profile ---- */
  const actions = $('.nav-actions');
  const box = document.createElement('div');
  box.className = 'nav-extra';
  box.innerHTML =
    '<select class="lang-select" id="lang-select" aria-label="Language"><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option></select>' +
    '<button class="icon-btn" id="theme-btn" type="button" aria-label="Toggle light and dark mode"></button>' +
    '<button class="btn btn-ghost" id="profile-btn" type="button"><span id="profile-label">Profile</span></button>';
  actions.appendChild(box);

  const root = document.documentElement;
  const themeBtn = $('#theme-btn');
  function setTheme(t) { root.dataset.theme = t; ls.set('cinevox.theme', t); themeBtn.textContent = t === 'light' ? '☾' : '☀'; }
  setTheme(ls.get('cinevox.theme', 'dark'));
  themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));

  const langSel = $('#lang-select');
  function setLang(l) { lang = l; ls.set('cinevox.lang', l); root.lang = l; langSel.value = l; tr(document.body); }
  langSel.addEventListener('change', () => setLang(langSel.value));

  /* ---- Profile (stored in this browser) ---- */
  let profile = ls.get('cinevox.profile', null);
  const dlg = document.createElement('dialog');
  dlg.className = 'modal modal-small';
  dlg.id = 'profile-dialog';
  dlg.innerHTML =
    '<form class="profile-form" id="profile-form"><h2>Create your profile</h2>' +
    '<label>Your name<input name="name" required maxlength="30" autocomplete="nickname"></label>' +
    '<label>Your age<input name="age" type="number" min="3" max="120" required></label>' +
    '<p class="muted">Your age sets the age-rating filter automatically.</p>' +
    '<div class="detail-actions"><button class="btn btn-primary" type="submit">Save profile</button>' +
    '<button class="btn btn-ghost" type="button" id="profile-delete">Delete profile</button>' +
    '<button class="btn btn-ghost" type="button" id="profile-close">Close</button></div></form>';
  document.body.appendChild(dlg);
  const pf = $('#profile-form');

  function applyAge() {
    const a = profile && +profile.age;
    const sel = $('#filter-age');
    if (!a || !sel) return;
    sel.value = a < 7 ? 'G' : a < 13 ? 'PG' : a < 17 ? 'PG-13' : 'all';
    sel.dispatchEvent(new Event('change'));
  }
  function showProfile() {
    $('#profile-label').textContent = profile ? profile.name : 'Profile';
    $('#profile-delete').hidden = !profile;
  }
  $('#profile-btn').addEventListener('click', () => {
    pf.name.value = profile ? profile.name : '';
    pf.age.value = profile ? profile.age : '';
    dlg.showModal();
  });
  $('#profile-close').addEventListener('click', () => dlg.close());
  pf.addEventListener('submit', (e) => {
    e.preventDefault();
    profile = { name: pf.name.value.trim(), age: +pf.age.value };
    ls.set('cinevox.profile', profile);
    showProfile(); applyAge(); dlg.close();
  });
  $('#profile-delete').addEventListener('click', () => {
    profile = null; ls.set('cinevox.profile', null); showProfile(); dlg.close();
  });

  /* ---- Comments under each title (saved in this browser) ---- */
  const dc = $('#detail-content');
  new MutationObserver(() => {
    const info = $('.detail-info', dc);
    if (!info || $('#comments', dc)) return;
    const btn = $('[data-action="watch"]', dc);
    const id = btn && btn.dataset.id;
    if (!id) return;
    const sec = document.createElement('section');
    sec.className = 'comments';
    sec.id = 'comments';
    sec.innerHTML = '<h3>Comments</h3><ul class="comment-list"></ul>' +
      '<form class="comment-form"><input name="n" maxlength="30" placeholder="Your name">' +
      '<textarea name="t" required maxlength="300" placeholder="Write a comment…"></textarea>' +
      '<button class="btn btn-primary" type="submit">Post comment</button>' +
      '<p class="muted">Comments are saved in this browser only.</p></form>';
    info.appendChild(sec);
    const list = $('.comment-list', sec), form = $('.comment-form', sec);
    if (profile) form.n.value = profile.name;
    const draw = () => {
      const all = ls.get('cinevox.comments', {})[id] || [];
      list.innerHTML = '';
      if (!all.length) { const li = document.createElement('li'); li.textContent = 'No comments yet. Be the first!'; list.appendChild(li); return; }
      all.forEach((c) => {
        const li = document.createElement('li'), b = document.createElement('b'), t = document.createElement('time'), p = document.createElement('p');
        b.textContent = c.name; t.textContent = new Date(c.ts).toLocaleDateString(); p.textContent = c.text;
        li.append(b, t, p); list.appendChild(li);
      });
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const all = ls.get('cinevox.comments', {});
      (all[id] = all[id] || []).push({ name: form.n.value.trim() || 'Guest', text: form.t.value.trim(), ts: Date.now() });
      ls.set('cinevox.comments', all);
      form.t.value = ''; draw();
    });
    draw();
  }).observe(dc, { childList: true });

  showProfile();
  setLang(lang);
  setTimeout(applyAge, 400);
})();
