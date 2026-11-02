// Progressive enhancement for the publications list: theme filters,
// PDF / Video / BibTeX buttons.
// The page is fully readable without this script.
(function () {
  // Research themes. Each publication lists its keys in data-tags.
  var THEMES = {
    genai: 'Generative AI & LLMs',
    media: 'Video & Multimodal',
    creativity: 'Creativity & Storytelling',
    xai: 'Explainable AI',
    vis: 'Visual Analytics',
    sci: 'Scientific Data'
  };

  var ICONS = {
    pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
    bibtex: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2"/></svg>'
  };

  var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
  var filters = document.getElementById('filters');
  var count = document.getElementById('resultCount');

  function tagsOf(pub) { return (pub.dataset.tags || '').split(/\s+/).filter(Boolean); }

  // ---- BibTeX, generated from the card's own text ----
  // To use an exact entry instead, put it inside the article as
  // <script type="text/plain" class="bib">@inproceedings{...}</script>
  function bibtexFor(pub) {
    var custom = pub.querySelector('script.bib');
    if (custom) return custom.textContent.trim();

    var title = pub.querySelector('h3').textContent.trim();
    var authors = pub.querySelector('.authors').textContent.trim().split(/\s*,\s*/).join(' and ');
    var venue = pub.querySelector('.venue-tag').textContent.trim().replace(/\s*\d{4}$/, '');
    var year = pub.dataset.year;
    var isJournal = /TVCG|Transactions|Informatics/.test(venue);
    var firstSurname = authors.split(' and ')[0].split(' ').pop().toLowerCase();
    var key = firstSurname + year + pub.id.replace(/-/g, '');

    return '@' + (isJournal ? 'article' : 'inproceedings') + '{' + key + ',\n' +
      '  title     = {' + title + '},\n' +
      '  author    = {' + authors + '},\n' +
      '  ' + (isJournal ? 'journal  ' : 'booktitle') + ' = {' + venue + '},\n' +
      '  year      = {' + year + '}\n}';
  }

  function iconLink(kind, label, href) {
    var el = document.createElement(href ? 'a' : 'button');
    el.className = 'icon-link';
    if (href) el.href = href; else el.type = 'button';
    el.innerHTML = ICONS[kind] + '<span>' + label + '</span>';
    return el;
  }

  pubs.forEach(function (pub) {
    var body = pub.querySelector('.pub-body');
    var titleLink = pub.querySelector('h3 a');
    var old = pub.querySelector('.pub-links');
    var videos = old ? Array.prototype.slice.call(old.querySelectorAll('a')) : [];
    if (old) old.remove();

    var row = document.createElement('p');
    row.className = 'pub-links';
    if (titleLink && titleLink.getAttribute('href')) row.appendChild(iconLink('pdf', 'PDF', titleLink.href));
    videos.forEach(function (a) { row.appendChild(iconLink('video', 'Video', a.href)); });
    if (row.children.length) body.appendChild(row);

    // data-no-bib on the article hides the BibTeX button
    if (pub.hasAttribute('data-no-bib')) return;

    var bibBtn = iconLink('bibtex', 'BibTeX');
    bibBtn.setAttribute('aria-expanded', 'false');
    row.appendChild(bibBtn);
    if (!row.parentNode) body.appendChild(row);

    var panel = document.createElement('div');
    panel.className = 'bibtex';
    panel.hidden = true;
    panel.id = pub.id + '-bib';
    bibBtn.setAttribute('aria-controls', panel.id);
    var pre = document.createElement('pre');
    pre.textContent = bibtexFor(pub);
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'copy';
    copy.textContent = 'Copy';
    copy.addEventListener('click', function () {
      var done = function () {
        copy.textContent = 'Copied!';
        setTimeout(function () { copy.textContent = 'Copy'; }, 1500);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(pre.textContent).then(done, function () { selectText(pre); });
      } else {
        selectText(pre);
      }
    });
    panel.appendChild(copy);
    panel.appendChild(pre);
    body.appendChild(panel);

    bibBtn.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      bibBtn.setAttribute('aria-expanded', String(!panel.hidden));
    });
  });

  function selectText(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---- Filter chips (clicking the active theme again clears it) ----
  var activeTheme = null;
  var themeChips = {};
  Object.keys(THEMES).forEach(function (key) {
    if (!pubs.some(function (p) { return tagsOf(p).indexOf(key) !== -1; })) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.textContent = THEMES[key];
    b.addEventListener('click', function () { setTheme(key); });
    filters.appendChild(b);
    themeChips[key] = b;
  });

  function setTheme(key) {
    activeTheme = activeTheme === key ? null : key;
    Object.keys(themeChips).forEach(function (k) {
      themeChips[k].setAttribute('aria-pressed', String(k === activeTheme));
    });
    apply();
  }

  function apply() {
    var shown = 0;
    pubs.forEach(function (pub) {
      var ok = !activeTheme || tagsOf(pub).indexOf(activeTheme) !== -1;
      pub.classList.toggle('is-hidden', !ok);
      if (ok) shown++;
    });
    count.textContent = activeTheme ? 'Click the theme again to show all papers' : '';
  }
  apply();
})();
