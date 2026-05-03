(function() {
  var DOCS_ROOT = window.RUNHOP_DOCS_ROOT || "..";
  var state = {
    sections: [],
    pages: [],
    pageMap: new Map(),
    currentDoc: "/",
    currentSection: "Documentation",
    currentHeadings: [],
    searchIndex: [],
    headingObserver: null
  };

  var els = {
    nav: document.getElementById("nav"),
    article: document.getElementById("article"),
    loading: document.getElementById("loading"),
    tocLinks: document.getElementById("toc-links"),
    contextTitle: document.getElementById("context-title"),
    contextSection: document.getElementById("context-section"),
    searchInput: document.getElementById("search-input"),
    searchResults: document.getElementById("search-results"),
    sidebar: document.getElementById("sidebar"),
    menuToggle: document.getElementById("menu-toggle"),
    sidebarClose: document.getElementById("sidebar-close")
  };

  init();

  async function init() {
    wireUi();
    state.sections = await loadSidebar();
    state.pages = flattenPages(state.sections);
    state.pageMap = new Map(state.pages.map(function(page) {
      return [normalizeDocPath(page.path), page];
    }));
    renderNav();
    buildSearchIndex();
    await renderRoute();
  }

  function wireUi() {
    window.addEventListener("popstate", function() {
      renderRoute();
    });

    document.addEventListener("click", function(event) {
      var subToggle = event.target.closest("[data-toggle-doc]");
      if (subToggle) {
        event.preventDefault();
        event.stopPropagation();
        var docPath = normalizeDocPath(subToggle.getAttribute("data-toggle-doc"));
        var item = state.pageMap.get(docPath);
        if (!item || !item.headings || !item.headings.length) {
          navigateTo(docPath);
          return;
        }
        item.open = !item.open;
        renderNav();
        return;
      }

      var link = event.target.closest("[data-doc-link]");
      if (link) {
        event.preventDefault();
        navigateTo(link.getAttribute("data-doc-link"), link.getAttribute("data-anchor") || "");
        return;
      }
    });

    els.searchInput.addEventListener("input", function(event) {
      renderSearchResults(event.target.value.trim().toLowerCase());
    });

    document.addEventListener("click", function(event) {
      if (!event.target.closest(".search")) {
        els.searchResults.classList.add("hidden");
      }
    });

    els.menuToggle.addEventListener("click", function() {
      els.sidebar.classList.add("is-open");
    });

    els.sidebarClose.addEventListener("click", function() {
      els.sidebar.classList.remove("is-open");
    });
  }

  async function loadSidebar() {
    var response = await fetch(DOCS_ROOT + "/_sidebar.md");
    var markdown = await response.text();
    var lines = markdown.split(/\r?\n/);
    var sections = [];
    var currentSection = null;

    lines.forEach(function(line) {
      var sectionMatch = line.match(/^- \*\*(.+)\*\*$/);
      if (sectionMatch) {
        currentSection = {
          title: sectionMatch[1].trim(),
          items: []
        };
        sections.push(currentSection);
        return;
      }

      var pageMatch = line.match(/^\s+- \[(.+)\]\((.+)\)$/);
      if (pageMatch && currentSection) {
        currentSection.items.push({
          title: pageMatch[1].trim(),
          path: normalizeDocPath(pageMatch[2].trim()),
          open: false,
          headings: []
        });
      }
    });

    return sections;
  }

  function flattenPages(sections) {
    return sections.reduce(function(acc, section) {
      return acc.concat(section.items.map(function(item) {
        item.section = section.title;
        return item;
      }));
    }, []);
  }

  async function renderRoute() {
    var route = getCurrentRoute();
    var previousDoc = state.currentDoc;
    state.currentDoc = route.doc;
    els.sidebar.classList.remove("is-open");

    var page = state.pageMap.get(route.doc) || state.pageMap.get("/");
    if (!page) {
      renderNotFound();
      return;
    }

    state.currentSection = page.section || "Documentation";
    els.contextSection.textContent = state.currentSection;
    els.contextTitle.textContent = page.title;
    els.loading.textContent = "Loading…";
    els.article.innerHTML = '<div class="article__loading" id="loading">Loading…</div>';

    try {
      var markdown = await fetchDoc(page.path);
      var renderResult = renderMarkdown(markdown, page.path);
      page.headings = renderResult.headings;
      state.currentHeadings = renderResult.headings;

      if (previousDoc !== page.path) {
        state.pages.forEach(function(item) {
          item.open = item.path === page.path;
        });
      }

      els.article.innerHTML = '<div class="article__body">' + renderResult.html + "</div>";
      highlightCode();
      renderNav();
      renderToc(renderResult.headings);
      syncHeadingFocus();
      if (route.anchor) {
        scrollToAnchor(route.anchor);
      } else {
        document.querySelector(".workspace").scrollTo({ top: 0, behavior: "auto" });
      }
    } catch (error) {
      els.article.innerHTML = '<div class="empty-state"><h2>Failed to load document</h2><p>' + escapeHtml(String(error)) + "</p></div>";
      els.tocLinks.innerHTML = "";
    }
  }

  async function fetchDoc(path) {
    var response = await fetch(toFilePath(path));
    if (!response.ok) {
      throw new Error("Unable to load " + path);
    }
    return response.text();
  }

  function renderMarkdown(markdown, currentPath) {
    var headings = [];
    var slugCounts = new Map();
    marked.setOptions({
      gfm: true,
      breaks: false
    });

    var rawHtml = marked.parse(markdown);
    var container = document.createElement("div");
    container.innerHTML = rawHtml;

    container.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function(heading) {
      var depth = Number(heading.tagName.slice(1));
      var text = heading.textContent.trim();
      var slug = uniqueSlug(slugify(text), slugCounts);
      heading.id = slug;
      if (depth >= 2 && depth <= 3) {
        headings.push({ id: slug, text: text, depth: depth });
      }
    });

    container.querySelectorAll("a").forEach(function(link) {
      var href = link.getAttribute("href") || "";
      if (!href) {
        return;
      }

      if (href.startsWith("http://") || href.startsWith("https://")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noreferrer");
        return;
      }

      if (href.startsWith("#")) {
        return;
      }

      var resolved = resolveRelativePath(currentPath, href);
      if (resolved.isDoc) {
        link.setAttribute("href", buildUrl(resolved.path, resolved.anchor));
        link.setAttribute("data-doc-link", resolved.path);
        if (resolved.anchor) {
          link.setAttribute("data-anchor", resolved.anchor);
        }
      }
    });

    container.querySelectorAll("img").forEach(function(image) {
      var src = image.getAttribute("src") || "";
      if (!src) {
        return;
      }
      image.setAttribute("src", resolveAssetPath(currentPath, src));
    });

    return {
      html: container.innerHTML,
      headings: headings
    };
  }

  function renderNav() {
    var html = state.sections.map(function(section) {
      return [
        '<section class="nav__section">',
        '  <h2 class="nav__section-title">' + escapeHtml(section.title) + "</h2>",
        '  <div class="nav__items">',
        section.items.map(renderNavItem).join(""),
        "  </div>",
        "</section>"
      ].join("");
    }).join("");

    els.nav.innerHTML = html;
  }

  function renderNavItem(item) {
    var isActive = item.path === state.currentDoc;
    var hasSubitems = Array.isArray(item.headings) && item.headings.length > 0;
    var isOpen = item.open && hasSubitems;

    return [
      '<div class="nav__item' + (isOpen ? " is-open" : "") + '">',
      '  <a class="nav__item-link' + (isActive ? " is-active" : "") + '" href="' + buildUrl(item.path) + '" data-doc-link="' + item.path + '">',
      hasSubitems ? '    <button class="nav__caret" type="button" aria-label="Toggle section" data-toggle-doc="' + item.path + '"></button>' : '    <span class="nav__caret nav__caret--placeholder"></span>',
      '    <span class="nav__item-label">' + escapeHtml(item.title) + "</span>",
      "  </a>",
      isOpen ? renderNavSubitems(item.headings, item.path) : "",
      "</div>"
    ].join("");
  }

  function renderNavSubitems(headings, docPath) {
    return [
      '<div class="nav__subitems">',
      headings.map(function(heading) {
        var active = location.hash === "#" + heading.id;
        return '<a class="nav__subitem' + (active ? " is-active" : "") + '" href="' + buildUrl(docPath, heading.id) + '" data-doc-link="' + docPath + '" data-anchor="' + heading.id + '">' + escapeHtml(heading.text) + "</a>";
      }).join(""),
      "</div>"
    ].join("");
  }

  function renderToc(headings) {
    if (!headings.length) {
      els.tocLinks.innerHTML = '<span class="toc__link">No sections</span>';
      return;
    }

    els.tocLinks.innerHTML = headings.map(function(heading) {
      return '<a class="toc__link toc__link--depth-' + heading.depth + '" href="' + buildUrl(state.currentDoc, heading.id) + '" data-doc-link="' + state.currentDoc + '" data-anchor="' + heading.id + '">' + escapeHtml(heading.text) + "</a>";
    }).join("");
  }

  function renderSearchResults(query) {
    if (!query) {
      els.searchResults.classList.add("hidden");
      els.searchResults.innerHTML = "";
      return;
    }

    var matches = state.searchIndex.filter(function(entry) {
      return entry.searchText.indexOf(query) !== -1;
    }).slice(0, 16);

    if (!matches.length) {
      els.searchResults.innerHTML = '<div class="search-results__item"><span class="search-results__title">No results</span></div>';
      els.searchResults.classList.remove("hidden");
      return;
    }

    els.searchResults.innerHTML = matches.map(function(match) {
      return [
        '<a class="search-results__item" href="' + buildUrl(match.path, match.anchor) + '" data-doc-link="' + match.path + '"' + (match.anchor ? ' data-anchor="' + match.anchor + '"' : "") + '>',
        '  <span class="search-results__title">' + escapeHtml(match.title) + "</span>",
        '  <span class="search-results__meta">' + escapeHtml(match.meta) + "</span>",
        "</a>"
      ].join("");
    }).join("");
    els.searchResults.classList.remove("hidden");
  }

  async function buildSearchIndex() {
    var pages = await Promise.all(state.pages.map(async function(page) {
      try {
        var markdown = await fetchDoc(page.path);
        var headings = extractHeadings(markdown);
        page.headings = headings;

        var entries = [{
          title: page.title,
          meta: page.section,
          path: page.path,
          anchor: "",
          searchText: [page.title, page.section, markdown].join(" ").toLowerCase()
        }];

        headings.forEach(function(heading) {
          entries.push({
            title: heading.text,
            meta: page.title,
            path: page.path,
            anchor: heading.id,
            searchText: [heading.text, page.title, page.section].join(" ").toLowerCase()
          });
        });

        return entries;
      } catch (error) {
        return [];
      }
    }));

    state.searchIndex = pages.flat();
    renderNav();
  }

  function extractHeadings(markdown) {
    var slugCounts = new Map();
    return markdown.split(/\r?\n/).map(function(line) {
      var match = line.match(/^(##|###)\s+(.+)$/);
      if (!match) {
        return null;
      }

      var text = match[2].trim();
      return {
        depth: match[1].length,
        text: text,
        id: uniqueSlug(slugify(text), slugCounts)
      };
    }).filter(Boolean);
  }

  function syncHeadingFocus() {
    if (state.headingObserver) {
      state.headingObserver.disconnect();
    }

    var links = Array.prototype.slice.call(document.querySelectorAll(".toc__link"));
    if (!links.length) {
      return;
    }

    state.headingObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) {
          return;
        }
        var id = entry.target.id;
        links.forEach(function(link) {
          var isActive = link.getAttribute("data-anchor") === id;
          link.classList.toggle("is-active", isActive);
          if (isActive) {
            keepLinkVisible(link, document.querySelector(".toc__inner"));
          }
        });
        document.querySelectorAll(".nav__subitem").forEach(function(link) {
          var isActive = link.getAttribute("data-anchor") === id;
          link.classList.toggle("is-active", isActive);
          if (isActive) {
            keepLinkVisible(link, link.closest(".nav__subitems"));
          }
        });
      });
    }, {
      root: document.querySelector(".workspace"),
      rootMargin: "-80px 0px -65% 0px",
      threshold: 0
    });

    state.currentHeadings.forEach(function(heading) {
      var el = document.getElementById(heading.id);
      if (el) {
        state.headingObserver.observe(el);
      }
    });
  }

  function scrollToAnchor(anchor) {
    var target = document.getElementById(anchor);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
  }

  function navigateTo(doc, anchor) {
    doc = normalizeDocPath(doc || "/");
    anchor = anchor || "";

    if (doc === state.currentDoc) {
      var sameDocUrl = buildUrl(doc, anchor);
      history.pushState({}, "", sameDocUrl);
      if (anchor) {
        scrollToAnchor(anchor);
      } else {
        document.querySelector(".workspace").scrollTo({ top: 0, behavior: "auto" });
      }
      markActiveAnchor(anchor);
      els.searchResults.classList.add("hidden");
      els.searchInput.blur();
      return;
    }

    var nextUrl = buildUrl(doc, anchor);
    history.pushState({}, "", nextUrl);
    renderRoute();
    els.searchResults.classList.add("hidden");
    els.searchInput.blur();
  }

  function buildUrl(doc, anchor) {
    var url = new URL(window.location.href);
    if (!doc || doc === "/") {
      url.searchParams.delete("doc");
    } else {
      url.searchParams.set("doc", doc);
    }
    url.hash = anchor ? "#" + anchor : "";
    return url.pathname + url.search + url.hash;
  }

  function getCurrentRoute() {
    var params = new URLSearchParams(window.location.search);
    return {
      doc: normalizeDocPath(params.get("doc") || "/"),
      anchor: window.location.hash.replace(/^#/, "")
    };
  }

  function normalizeDocPath(path) {
    if (!path || path === "/") {
      return "/";
    }
    return path.replace(/^\.?\//, "").replace(/^\//, "").replace(/\.md$/, ".md");
  }

  function toFilePath(doc) {
    if (doc === "/") {
      return DOCS_ROOT + "/README.md";
    }
    return DOCS_ROOT + "/" + doc;
  }

  function resolveRelativePath(currentPath, href) {
    var anchor = "";
    var cleanHref = href;
    if (href.indexOf("#") !== -1) {
      var parts = href.split("#");
      cleanHref = parts[0];
      anchor = parts[1] || "";
    }

    if (!cleanHref || cleanHref === "/") {
      return { path: "/", isDoc: true, anchor: anchor };
    }

    if (cleanHref.endsWith(".md")) {
      var base = currentPath === "/" ? "" : currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
      return {
        path: normalizeSegments(base + cleanHref),
        isDoc: true,
        anchor: anchor
      };
    }

    return {
      path: cleanHref,
      isDoc: false,
      anchor: anchor
    };
  }

  function resolveAssetPath(currentPath, href) {
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/")) {
      return href;
    }
    var base = currentPath === "/" ? "" : currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
    return DOCS_ROOT + "/" + normalizeSegments(base + href);
  }

  function normalizeSegments(path) {
    var output = [];
    path.split("/").forEach(function(part) {
      if (!part || part === ".") {
        return;
      }
      if (part === "..") {
        output.pop();
        return;
      }
      output.push(part);
    });
    return output.join("/");
  }

  function slugify(text) {
    return stripHtml(text)
      .toLowerCase()
      .replace(/[`~!@#$%^&*()+=<>{}\[\]|\\:;"',.?/]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function uniqueSlug(base, counts) {
    var slug = base || "section";
    var count = counts.get(slug) || 0;
    counts.set(slug, count + 1);
    return count ? slug + "-" + count : slug;
  }

  function stripHtml(text) {
    return text.replace(/<[^>]+>/g, "");
  }

  function highlightCode() {
    if (!window.Prism) {
      return;
    }
    document.querySelectorAll("pre code").forEach(function(block) {
      Prism.highlightElement(block);
    });
  }

  function renderNotFound() {
    els.contextTitle.textContent = "Not Found";
    els.article.innerHTML = '<div class="empty-state"><h2>Document not found</h2><p>The requested page does not exist in the current docs tree.</p></div>';
    els.tocLinks.innerHTML = "";
  }

  function markActiveAnchor(anchor) {
    document.querySelectorAll(".toc__link").forEach(function(link) {
      link.classList.toggle("is-active", !!anchor && link.getAttribute("data-anchor") === anchor);
    });
    document.querySelectorAll(".nav__subitem").forEach(function(link) {
      link.classList.toggle("is-active", !!anchor && link.getAttribute("data-anchor") === anchor);
    });
  }

  function keepLinkVisible(link, container) {
    if (!link || !container) {
      return;
    }

    var linkRect = link.getBoundingClientRect();
    var containerRect = container.getBoundingClientRect();
    var padding = 18;
    var outsideTop = linkRect.top < containerRect.top + padding;
    var outsideBottom = linkRect.bottom > containerRect.bottom - padding;

    if (!outsideTop && !outsideBottom) {
      return;
    }

    link.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto"
    });
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
