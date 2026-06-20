# Bing Search

Opens batches of randomized Bing searches in new tabs, with each tab closing itself automatically.

## Install

Open [bing-search.user.js](./bing-search.user.js), click **Raw**, and your userscript manager ([Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/)) will offer to install it.

Runs on `https://www.bing.com/*`.

## Usage

1. Allow pop-ups for `bing.com` (the script opens searches in new tabs).
2. Open Bing and click the **Start searches** button in the top-right corner.

![alt text](startsearches-showcase.png)

While a run is in progress the button shows live status — which batch and search it's opening (e.g. `Batch 2/8 · opening search 3/4`), and a countdown to the next batch during the waits (e.g. `Batch 2/8 done · next in 15:59`). It re-enables when the run finishes. Each opened search tab closes itself, so just leave the original tab open until the run completes.

## How it works

- A run is made of **batches**. Each batch opens `SEARCHES_PER_BATCH` searches in new tabs, waiting `DELAY_BETWEEN_SEARCHES_MS` between each. After a batch, it waits `DELAY_BETWEEN_BATCHES_MS` before the next one.
- Each search URL carries an `autoClose=true` flag. The opened tab is also running this script, sees that flag, waits `AUTO_CLOSE_DELAY_MS`, and closes itself.
- Search terms are chosen at random from a large built-in `SEARCH_TERMS` list, and each query is URL-encoded so terms with special characters (`?`, `&`, `;`, apostrophes, etc.) search correctly.

## Configuration

Tunable constants live at the top of the script:

| Constant                    | Default  | Meaning                                  |
| --------------------------- | -------- | ---------------------------------------- |
| `SEARCHES_PER_BATCH`        | `4`      | Searches opened per batch                |
| `BATCH_COUNT`               | `8`      | Number of batches per run                |
| `DELAY_BETWEEN_SEARCHES_MS` | `7500`   | Pause between searches in a batch        |
| `DELAY_BETWEEN_BATCHES_MS`  | `960000` | Pause between batches (16 min)           |
| `AUTO_CLOSE_DELAY_MS`       | `3500`   | How long an opened search tab stays open |

A full run takes roughly `BATCH_COUNT × DELAY_BETWEEN_BATCHES_MS` (~2 hours with the defaults), so keep the originating tab open for the duration.

## Notes

- Pop-up blocking will stop the new tabs from opening so allow pop-ups for Bing.
