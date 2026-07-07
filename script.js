/**
 * EGI'S NEON CYBERPUNK TIC-TAC-TOE — Core Logic
 * Handles state, unbeatable Minimax AI, and oscillator sound effects.
 */

// ============================================================
// AUDIO SYNTHESIZER (Web Audio API)
// ============================================================
class SynthAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    _initContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick(player) {
        if (!this.enabled) return;
        this._initContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Cyber sound design: square wave with fast pitch decay
        osc.type = 'square';
        const startFreq = player === 'X' ? 880 : 660;
        const endFreq = player === 'X' ? 1200 : 440;
        
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playWin() {
        if (!this.enabled) return;
        this._initContext();

        const now = this.ctx.currentTime;

        // Play an ascending electronic triplet arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0.15, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.25);
        });
    }

    playTie() {
        if (!this.enabled) return;
        this._initContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Buzzy sawtooth wave to indicate draw
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }
}

const synth = new SynthAudio();

// ============================================================
// GAME LOGIC & STATE
// ============================================================
const state = {
    board: Array(9).fill(""),
    currentPlayer: "X",
    gameMode: "ai", // "ai" | "pvp"
    isGameActive: true,
    scores: {
        X: 0,
        O: 0,
        ties: 0
    }
};

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// DOM Cache
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('hud');
const scoreboard = document.getElementById('scoreboard');
const boardWrap = document.getElementById('board-wrap');
const resultScreen = document.getElementById('result-screen');
const resultMessage = document.getElementById('result-message');
const cells = document.querySelectorAll('.cell');
const turnText = document.getElementById('active-turn');
const winLine = document.getElementById('win-line');
const winLineSvg = document.getElementById('win-line-svg');

// Buttons
const btnVsAI = document.getElementById('btn-vs-ai');
const btnPvP = document.getElementById('btn-pvp');
const btnBackMenu = document.getElementById('btn-back-menu');
const btnToggleSound = document.getElementById('btn-toggle-sound');
const btnNextRound = document.getElementById('btn-next-round');
const btnResetScores = document.getElementById('btn-reset-scores');

// Initialize Events
btnVsAI.addEventListener('click', () => startGame('ai'));
btnPvP.addEventListener('click', () => startGame('pvp'));
btnBackMenu.addEventListener('click', exitToMenu);
btnToggleSound.addEventListener('click', toggleSound);
btnNextRound.addEventListener('click', handleNextRoundClick);
btnResetScores.addEventListener('click', resetScoreboard);

cells.forEach(cell => {
    cell.addEventListener('click', () => handleCellClick(cell));
});

// Setup Initial Sound Button Styling
updateSoundButton();

function startGame(mode) {
    state.gameMode = mode;
    
    // Update Scorecard names
    const pO = document.getElementById('player-o-name');
    pO.textContent = mode === 'ai' ? 'SYSTEM AI' : 'PLAYER O';

    // Hide Start menu, show Board & HUD
    startScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    scoreboard.classList.remove('hidden');
    boardWrap.classList.remove('hidden');

    resetScoreboard();
    startNextRound();
}

function exitToMenu() {
    startScreen.classList.remove('hidden');
    hud.classList.add('hidden');
    scoreboard.classList.add('hidden');
    boardWrap.classList.add('hidden');
    resultScreen.classList.add('hidden');
}

function toggleSound() {
    synth.enabled = !synth.enabled;
    updateSoundButton();
}

function updateSoundButton() {
    const btn = document.getElementById('btn-toggle-sound');
    if (synth.enabled) {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        btn.title = "Mute Sound";
    } else {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        btn.title = "Unmute Sound";
    }
}

function startNextRound() {
    state.board.fill("");
    state.currentPlayer = "X";
    state.isGameActive = true;

    // Reset UI
    cells.forEach(cell => {
        cell.className = 'cell';
    });

    winLine.removeAttribute('class');
    winLine.setAttribute('x1', 0);
    winLine.setAttribute('y1', 0);
    winLine.setAttribute('x2', 0);
    winLine.setAttribute('y2', 0);

    resultScreen.classList.add('hidden');
    updateTurnIndicator();
}

function resetScoreboard() {
    state.scores.X = 0;
    state.scores.O = 0;
    state.scores.ties = 0;
    updateScoreboardDisplay();
}

function updateScoreboardDisplay() {
    document.getElementById('score-x').textContent = state.scores.X;
    document.getElementById('score-o').textContent = state.scores.O;
    document.getElementById('score-ties').textContent = state.scores.ties;
    updateMatchDots();
}

function updateMatchDots() {
    const dotsX = document.querySelectorAll('#dots-x .dot');
    const dotsO = document.querySelectorAll('#dots-o .dot');
    
    dotsX.forEach(dot => dot.className = 'dot');
    dotsO.forEach(dot => dot.className = 'dot');
    
    for (let i = 0; i < Math.min(2, state.scores.X); i++) {
        dotsX[i].classList.add('active-cyan');
    }
    for (let i = 0; i < Math.min(2, state.scores.O); i++) {
        dotsO[i].classList.add('active-pink');
    }
}

function handleNextRoundClick() {
    if (btnNextRound.dataset.action === "reset-match") {
        resetScoreboard();
    }
    startNextRound();
}

function updateTurnIndicator() {
    turnText.textContent = `PLAYER ${state.currentPlayer}`;
    turnText.className = state.currentPlayer === 'X' ? 'cyan-turn' : 'pink-turn';
}

function handleCellClick(cell) {
    const idx = parseInt(cell.dataset.index);

    if (state.board[idx] !== "" || !state.isGameActive) return;

    // User Move
    makeMove(idx, state.currentPlayer);

    if (checkGameStatus()) return;

    // Trigger AI Move if single player mode
    if (state.gameMode === 'ai' && state.isGameActive) {
        triggerAIMove();
    }
}

function triggerAIMove() {
    state.isGameActive = false; // Block user clicks during AI evaluation
    setTimeout(() => {
        const aiIdx = getBestMove();
        makeMove(aiIdx, "O");
        state.isGameActive = true;
        checkGameStatus();
    }, 350); // Small cyber delay
}

function makeMove(idx, player) {
    state.board[idx] = player;
    cells[idx].classList.add(player.toLowerCase());
    synth.playClick(player);

    state.currentPlayer = player === "X" ? "O" : "X";
    updateTurnIndicator();
}

function checkGameStatus() {
    const winner = checkWinner(state.board);

    if (winner) {
        state.isGameActive = false;
        state.scores[winner.player]++;
        updateScoreboardDisplay();
        
        // Render Win Line SVG overlay coordinates
        drawWinningLine(winner.line, winner.player);
        synth.playWin();

        const matchOver = state.scores.X === 2 || state.scores.O === 2;

        setTimeout(() => {
            if (matchOver) {
                const winnerName = winner.player === 'X' ? 'PLAYER X' : (state.gameMode === 'ai' ? 'SYSTEM AI' : 'PLAYER O');
                showResult(`${winnerName} WINS THE MATCH!`);
                btnNextRound.querySelector('span').textContent = "PLAY NEW MATCH";
                btnNextRound.dataset.action = "reset-match";
            } else {
                showResult(`${winner.player === 'X' ? 'PLAYER X' : (state.gameMode === 'ai' ? 'SYSTEM AI' : 'PLAYER O')} WINS THE ROUND`);
                btnNextRound.querySelector('span').textContent = "NEXT ROUND";
                btnNextRound.dataset.action = "next-round";
            }
        }, 700);
        return true;
    }

    if (state.board.every(cell => cell !== "")) {
        state.isGameActive = false;
        state.scores.ties++;
        updateScoreboardDisplay();
        synth.playTie();

        setTimeout(() => {
            showResult("ROUND TIE (GRID LOCK)");
            btnNextRound.querySelector('span').textContent = "NEXT ROUND";
            btnNextRound.dataset.action = "next-round";
        }, 500);
        return true;
    }

    return false;
}

function drawWinningLine(combo, winner) {
    const cellBounds = Array.from(cells).map(cell => {
        return {
            x: cell.offsetLeft + cell.offsetWidth / 2,
            y: cell.offsetTop + cell.offsetHeight / 2
        };
    });

    const start = cellBounds[combo[0]];
    const end = cellBounds[combo[2]];

    winLine.setAttribute('x1', start.x);
    winLine.setAttribute('y1', start.y);
    winLine.setAttribute('x2', end.x);
    winLine.setAttribute('y2', end.y);
    winLine.setAttribute('class', winner === 'X' ? 'win-cyan' : 'win-pink');
}

function showResult(message) {
    resultMessage.textContent = message;
    resultMessage.className = 'neon-text-title';
    if (message.includes('X')) {
        resultMessage.style.textShadow = '0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan-glow)';
    } else if (message.includes('AI') || message.includes('O')) {
        resultMessage.style.textShadow = '0 0 10px var(--neon-pink), 0 0 20px var(--neon-pink-glow)';
    } else {
        resultMessage.style.textShadow = '0 0 10px var(--neon-purple), 0 0 20px var(--neon-purple-glow)';
    }

    resultScreen.classList.remove('hidden');
}

function checkWinner(board) {
    for (const combo of WINNING_COMBOS) {
        const [a, b, c] = combo;
        if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
            return { player: board[a], line: combo };
        }
    }
    return null;
}

// ============================================================
// MINIMAX UNBEATABLE AI ALGORITHM
// ============================================================
function getBestMove() {
    // If board is completely empty, pick a random cell to keep the game openings varied
    const isEmpty = state.board.every(cell => cell === "");
    if (isEmpty) {
        return Math.floor(Math.random() * 9);
    }

    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < 9; i++) {
        if (state.board[i] === "") {
            state.board[i] = "O"; // AI move
            let score = minimax(state.board, 0, false);
            state.board[i] = ""; // Undo move
            
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing) {
    const winner = checkWinner(board);
    
    // Evaluation scores
    if (winner && winner.player === "O") return 10 - depth;
    if (winner && winner.player === "X") return depth - 10;
    if (board.every(cell => cell !== "")) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = "O";
                let score = minimax(board, depth + 1, false);
                board[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = "X";
                let score = minimax(board, depth + 1, true);
                board[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}
