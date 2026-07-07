# 🎮 Retro Tic-Tac-Toe

A modern, highly immersive Tic-Tac-Toe game styled with a futuristic **Cyberpunk/Neon theme**, powered by Web Audio API synthesizers and an unbeatable Minimax AI.

---

## 🚀 Key Features

* **⚡ Cyberpunk & Neon Aesthetic**: Custom dark interface with electric cyan (`#00f2fe`) and hot pink (`#ff007f`) glows.
* **🏆 Best of 3 Match System**: Tracks round wins visually using pulsing neon indicator dots in the scoreboard. The first player to score 2 round wins takes the entire Match.
* **🤖 Unbeatable Minimax AI**: Plays perfectly in single-player mode, finding optimal blocks and counter-strategies to prevent any user wins.
* **👥 Local 2 Players (PVP)**: Local gameplay for side-by-side matches.
* **🎵 Oscillator Web Audio Synthesis**: Real-time synthesized arcade-style sound effects (clicks, win arpeggios, tie buzzers) generated on the fly.
* **📐 SVG Win Lines**: Dynamically traces a glowing vector path connecting winning cell coordinates.

---

## ⌨️ Keyboard & Interface Controls

- **VS SYSTEM AI**: Play against the unbeatable Minimax AI.
- **LOCAL 2 PLAYERS**: Alternate moves between Player X and Player O.
- **Sound Toggle (HUD)**: Mute/unmute the synthesized audio.
- **Exit Button (HUD)**: Return to the main menu.
- **Result Overlay**: Reset scores or advance to the next round of the match.

---

## 🚀 How to Run Locally

Since the application uses raw ES6 modules and Web Audio API, serve it via a local web server to prevent browser CORS block policies.

1. Navigate to the game folder:
   ```bash
   cd "Retro TIC-TAC-TOE"
   ```
2. Start a local server:
   - **Node.js (serve)**:
     ```bash
     npx serve . -l 3001
     ```
   - **Python**:
     ```bash
     python -m http.server 3001
     ```
3. Open `http://localhost:3001` in your browser.
