# GitHub DNA Pet 🧬🐾

A Chrome extension that brings your GitHub contribution graph to life with procedurally generated, deterministic digital pets.

## 🌟 The Concept

Your GitHub commit history is your pet's DNA. This extension reads a hex signature from your profile (provided by `gh-pulse-signature`) and uses it as a seed for a procedural generation engine. 

- **Deterministic:** The same signature always produces the exact same pet. 
- **Evolutionary:** As your signature grows with new commits, your pet can mutate and evolve.
- **Interactive:** Your pet patrols the "contribution squares" of your GitHub profile.

## 🚀 Features

- **Procedural Engine:** Powered by a seeded `mulberry32` PRNG for consistent results.
- **Paper Doll System:** Dynamic CSS-based rendering for different body types (Slime, Cube, Wisp, Mecha-Spider), colors, and mutations (Horns, Halos, Wings, Spikes).
- **Pathfinding:** A patrol loop that moves the pet across your contribution graph.
- **Per-Profile Control:** A popup menu to enable or disable the pet for specific users.
- **Fully Typed:** Built with TypeScript for reliability.

## 🛠️ Technical Stack

- **Language:** TypeScript
- **Bundler:** esbuild
- **Testing:** Jest + ts-jest
- **Platform:** Chrome Extension Manifest V3

## 📦 Installation & Setup

### Development

1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/github-dna-pet.git
   cd github-dna-pet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```
   This generates a self-contained extension in the `dist/` folder.

4. **Load into Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right).
   - Click "Load unpacked".
   - Select the `dist/` folder in this repository.

### Testing

Run the procedural engine unit tests:
```bash
npm test
```

## 📂 Project Structure

- `engine.ts`: The core procedural logic and PRNG.
- `content.ts`: Content script for DOM injection and patrol logic.
- `popup.ts`: Logic for the extension settings popup.
- `style.css`: Visual styles and animations for the pets.
- `dist/`: The final, loadable extension files.
- `tests/`: Jest unit tests for the engine.

## 📜 License

ISC
