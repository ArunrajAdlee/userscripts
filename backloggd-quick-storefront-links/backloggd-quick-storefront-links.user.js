// ==UserScript==
// @name         Backloggd Quick Storefront Links
// @namespace    https://github.com/ArunrajAdlee/userscripts
// @version      1.0
// @description  Adds quick storefront search links (GG.deals, Epic, Steam, Xbox) to games on Backloggd
// @author       ArunrajAdlee
// @match        https://backloggd.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=backloggd.com
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Build the storefront search links for a given game name.
  function getLinksByGame(gameName) {
    const query = encodeURIComponent(gameName);
    return [
      {
        href: `https://gg.deals/games/?title=${query}`,
        domain: 'gg.deals',
        alt: 'GG.deals',
      },
      {
        href: `https://store.epicgames.com/en-US/browse?q=${query}&sortBy=relevancy&sortDir=DESC&count=40`,
        domain: 'store.epicgames.com',
        alt: 'Epic Games Store',
      },
      {
        href: `https://store.steampowered.com/search/?term=${query}`,
        domain: 'store.steampowered.com',
        alt: 'Steam',
      },
      {
        href: `https://www.xbox.com/en-CA/search/results/games?q=${query}&IncludedInSubscription=CFQ7TTC0KGQ8%2CCFQ7TTC0K5DH`,
        domain: 'www.xbox.com',
        alt: 'Xbox',
      },
    ];
  }

  // Create a single favicon link element.
  function createLinkElement(link, iconSize) {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.title = link.alt;

    const icon = document.createElement('img');
    icon.width = iconSize;
    icon.height = iconSize;
    icon.src = `https://www.google.com/s2/favicons?sz=64&domain=${link.domain}`;
    icon.alt = link.alt;

    anchor.appendChild(icon);
    return anchor;
  }

  // Create a row container holding a link for every storefront.
  function createLinksRow(gameName, iconSize) {
    const row = document.createElement('div');
    row.className = 'linksAdded';
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.justifyContent = 'center';
    row.style.alignItems = 'center';

    getLinksByGame(gameName).forEach((link) =>
      row.appendChild(createLinkElement(link, iconSize)),
    );
    return row;
  }

  // Overlay a row of storefront links across the top of a cover card.
  function addLinksToCover(coverCard, iconSize) {
    // Nest inside the wrapper so the overlay is clipped to the rounded cover.
    const wrapper = coverCard.querySelector('.overflow-wrapper') || coverCard;

    // Prefer the card's caption (always in the server HTML, so it's reliable on
    // freshly paginated lists), then the cover image's alt, then the page
    // heading on a game page.
    const caption = coverCard.querySelector('.game-text-centered');
    const coverImage = coverCard.querySelector('img');
    const heading = document.querySelector('div.game-title-section h1');
    const gameName = (
      caption?.textContent ||
      coverImage?.alt ||
      heading?.textContent ||
      ''
    ).trim();
    if (!gameName) return;

    const existing = wrapper.querySelector(':scope > .linksAdded');
    if (existing) {
      if (existing.dataset.game === gameName) return; // correct overlay present
      existing.remove(); // card recycled for another game — rebuild below
    }

    const row = createLinksRow(gameName, iconSize);
    row.dataset.game = gameName;
    // Overlay the links across the top of the cover.
    row.style.position = 'absolute';
    row.style.top = '0';
    row.style.left = '0';
    row.style.right = '0';
    row.style.zIndex = '100';
    row.style.background = 'rgba(0, 0, 0, 0.6)';
    // Keep all icons on a single line even on narrow covers.
    row.style.flexWrap = 'nowrap';
    // Space the icons out proportionally to their size.
    row.style.gap = `${Math.round(iconSize / 2)}px`;
    row.style.padding = `${Math.round(iconSize / 3)}px 0`;
    // Clicking a store icon shouldn't also trigger the card's own link.
    row.addEventListener('click', (event) => event.stopPropagation());

    if (getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }
    wrapper.appendChild(row);
  }

  function addLinks() {
    // On a game page, the main cover gets larger icons.
    if (document.querySelector('div.game-title-section')) {
      const mainCover = document.querySelector('div.game-cover');
      if (mainCover) addLinksToCover(mainCover, 28);
    }

    // Every other cover (lists, collections, related games) gets smaller icons.
    document
      .querySelectorAll('div.game-cover')
      .forEach((coverCard) => addLinksToCover(coverCard, 16));
  }

  // Backloggd is a SPA: paginating re-renders the list component, and that
  // render reconciles our injected overlay away. Reacting to mutations alone
  // can't win that race reliably, so we use two mechanisms together, both
  // relying on addLinks being idempotent (it checks for an existing overlay):
  //
  //   1. A debounced MutationObserver — responsive to DOM/lazy-load changes.
  //   2. A steady interval — a safety net that restores the overlay shortly
  //      after any re-render removes it, regardless of how the SPA updates.
  let settleTimer;
  function addLinksWhenSettled() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(addLinks, 150);
  }

  const observer = new MutationObserver(addLinksWhenSettled);
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(addLinks, 1000);
  addLinks();
  addEventListener('navigatesuccess', addLinksWhenSettled);
})();
