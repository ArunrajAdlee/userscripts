// ==UserScript==
// @name         YouTube Macros
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Keyboard macros for YouTube: step playback speed, hide player chrome for clean fullscreen, and download the current video frame (also adds a screenshot button to the control bar).
// @author       ArunrajAdlee
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

/*
 * Keyboard shortcuts (keypress while on a YouTube page):
 *
 *   *   step playback speed up    (next value in SPEEDS)
 *   /   step playback speed down  (previous value in SPEEDS)
 *   -   download the current video frame
 *   `   toggle hiding the player chrome (for a clean fullscreen view)
 *
 * Also injects a camera button into the player control bar that downloads
 * the current frame, equivalent to pressing '-'.
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  // Playback speeds to cycle through, ascending. Edit to taste, but note the
  // YouTube player API only honors its supported rates (0.25–2 in 0.25 steps).
  const SPEEDS = [0.5, 1, 1.5, 2];

  // Player-chrome elements hidden by the '`' toggle for a clean fullscreen view.
  const HIDDEN_CLASSES = [
    "ytp-overlay-top-left",
    "ytp-chrome-bottom",
    "ytp-fullscreen-grid-buttons-container",
    "ytp-fullscreen-quick-actions",
  ];

  // Keypress keyCodes for each macro.
  const KEY = {
    SPEED_UP: 42, // *
    SPEED_DOWN: 47, // /
    SCREENSHOT: 45, // -
    TOGGLE_CHROME: 96, // `
  };

  const SCREENSHOT_BUTTON_ID = "yt-macros-screenshot-button";

  // Whether the player chrome is currently hidden by the '`' toggle.
  let chromeHidden = false;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Returns the YouTube player element, which exposes the player API
  // (getPlaybackRate, setPlaybackRate, getVideoData, ...).
  function getPlayer() {
    return document.getElementById("movie_player");
  }

  function getVideo() {
    return (
      document.querySelector("#movie_player video") ||
      document.querySelector("video")
    );
  }

  // Trigger a browser download of a data/object URL under the given filename.
  function saveAs(uri, filename) {
    const link = document.createElement("a");
    if (typeof link.download !== "string") {
      window.open(uri);
      return;
    }
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link); // Firefox requires the link in the DOM
    link.click();
    document.body.removeChild(link);
  }

  // ---------------------------------------------------------------------------
  // Playback speed
  // ---------------------------------------------------------------------------

  // Step the playback rate to the next/previous value in SPEEDS relative to the
  // current rate. direction: +1 = faster, -1 = slower.
  //
  // We go through the player API (setPlaybackRate) rather than setting
  // <video>.playbackRate directly: the player overrides the raw video rate with
  // its own, and only the API call keeps the on-screen speed UI in sync.
  function stepSpeed(direction) {
    const player = getPlayer();
    if (!player || typeof player.setPlaybackRate !== "function") return;

    const currentSpeed = player.getPlaybackRate();
    const nextSpeed =
      direction > 0
        ? SPEEDS.find((speed) => speed > currentSpeed + 1e-9)
        : [...SPEEDS].reverse().find((speed) => speed < currentSpeed - 1e-9);

    if (nextSpeed != null) player.setPlaybackRate(nextSpeed);
  }

  // ---------------------------------------------------------------------------
  // Screenshot
  // ---------------------------------------------------------------------------

  // Build a "<video title> <H-MM-SS>.png" filename from the player title and the
  // current playback position. Strips characters illegal in filenames (notably
  // ':', so the timestamp uses dashes).
  function screenshotFilename(video) {
    const player = getPlayer();
    const title =
      (player && typeof player.getVideoData === "function"
        ? player.getVideoData().title
        : "") || "youtube-screenshot";

    const totalSeconds = Math.floor(video.currentTime || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const padTwoDigits = (value) => String(value).padStart(2, "0");
    const timestamp =
      (hours > 0 ? hours + "-" : "") +
      padTwoDigits(minutes) +
      "-" +
      padTwoDigits(seconds);

    const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim();
    return `${safeTitle} ${timestamp}.png`;
  }

  // Capture the current decoded video frame at native resolution and save it.
  // drawImage reads the actual frame instantly — no DOM rendering, no freeze.
  function captureFrame() {
    const video = getVideo();
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      saveAs(canvas.toDataURL("image/png"), screenshotFilename(video));
    } catch (error) {
      // toDataURL throws if the canvas is "tainted" by a cross-origin source.
      console.error(
        "Screenshot failed (canvas may be cross-origin tainted):",
        error
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Fullscreen chrome toggle
  // ---------------------------------------------------------------------------

  function toggleChrome() {
    chromeHidden = !chromeHidden;
    HIDDEN_CLASSES.forEach((className) => {
      document.querySelectorAll(`.${className}`).forEach((element) => {
        element.style.visibility = chromeHidden ? "hidden" : "";
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Screenshot button (player control bar)
  // ---------------------------------------------------------------------------

  function createScreenshotButton() {
    const button = document.createElement("button");
    button.id = SCREENSHOT_BUTTON_ID;
    button.className = "ytp-button"; // inherit YouTube's control-button styling
    button.title = "Download current frame";
    button.setAttribute("aria-label", "Download current frame");

    // Build the camera icon via DOM nodes rather than innerHTML — YouTube's
    // Trusted Types CSP (require-trusted-types-for 'script') blocks assigning a
    // plain string to innerHTML.
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("height", "24");
    svg.setAttribute("width", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    const cameraIcon = document.createElementNS(SVG_NAMESPACE, "path");
    cameraIcon.setAttribute("fill", "#fff");
    cameraIcon.setAttribute(
      "d",
      "M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
    );
    svg.appendChild(cameraIcon);
    button.appendChild(svg);

    button.addEventListener("click", (event) => {
      event.stopPropagation(); // don't toggle play/pause or close the controls
      captureFrame();
    });
    return button;
  }

  // YouTube is a single-page app and may rebuild its controls, so re-add the
  // button whenever it's missing rather than injecting just once.
  function ensureScreenshotButton() {
    if (document.getElementById(SCREENSHOT_BUTTON_ID)) return;
    const controls =
      document.querySelector(".ytp-right-controls-left") ||
      document.querySelector(".ytp-right-controls");
    if (!controls) return;
    controls.insertBefore(createScreenshotButton(), controls.firstChild);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function onKeypress(event) {
    switch ((event || window.event).keyCode) {
      case KEY.SPEED_DOWN:
        stepSpeed(-1);
        break;
      case KEY.SPEED_UP:
        stepSpeed(1);
        break;
      case KEY.SCREENSHOT:
        captureFrame();
        break;
      case KEY.TOGGLE_CHROME:
        toggleChrome();
        break;
    }
  }

  window.addEventListener("keypress", onKeypress, false);

  setInterval(ensureScreenshotButton, 1000);
  ensureScreenshotButton();
})();
