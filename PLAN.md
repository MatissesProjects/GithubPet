# Project Plan: GitHub DNA Pet

## Overview
A Chrome extension that reads a deterministically growing hex signature from a GitHub profile (`gh-pulse-signature`) to procedurally generate and animate a digital pet directly on the contribution graph.

The core concept is essentially a deterministic roguelike run, where your GitHub commit history acts as the procedural seed. Just like finding a wild item combination in The Binding of Isaac, a sudden spike in commits might mutate a standard slime into a winged, glitching cube. Because the logic is entirely JavaScript and DOM-based, this engine can easily be ported later into an OBS browser source if you ever want to display your current daily pet while streaming.

Here is the comprehensive summary, the essential code blocks to get your workspace started, and the scaffolding for your PLAN.md and TRACKS.md.

The Core Concept Summary
We are building a Chrome Extension Content Script that injects a living, procedurally generated digital pet onto a user's GitHub profile.

The Trigger: It waits for a specific third-party extension to load a hex signature (gh-pulse-signature).

The Extraction: It parses the signature, treating the last 4 characters as the "Genesis Block" (base seed) and the rest as the daily evolution chain (newest day first).

The Engine: It runs the string through a seeded PRNG (mulberry32) to deterministically calculate the pet's current species, colors, auras, and mutations.

The Stage: It renders the pet as a DOM element and uses a patrol loop to make it navigate the GitHub contribution graph (.js-calendar-graph).

## Core Architecture
* **Environment:** Chrome Extension (Manifest V3).
* **Execution:** Content Script injected into `github.com`.
* **Dependencies:** Relies on the external `gh-pulse-signature` DOM element.
* **Logic Model:** Deterministic State Machine. The pet's state is recalculated on every page load based entirely on the hex string, requiring zero database storage.

## Data Flow
1.  **Wait:** `MutationObserver` watches the DOM for `#gh-pulse-signature`.
2.  **Extract:** Parse `.gh-sig-char` spans into a single hex string.
3.  **Process:** * Slice the last 4 characters to establish the Genesis Block (Base Seed).
    * Iterate through the remaining string chronologically (right-to-left) to apply daily mutations based on hex value (0-F).
4.  **Render:** Inject a DOM element (`div`/`svg`) onto the `.js-calendar-graph`.
5.  **Animate:** Game loop calculating coordinates to make the pet patrol the commit squares.
