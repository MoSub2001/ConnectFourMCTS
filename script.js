class ConnectFour {
    constructor() {
        // Constants
        this.RED = 1;
        this.YELLOW = -1;
        this.EMPTY = 0;

        // Game status constants
        this.RED_WIN = 1;
        this.YELLOW_WIN = -1;
        this.DRAW = 0;
        this.ONGOING = -17;

        // Initialize the board, column heights, player, and status
        this.board = Array.from({ length: 7 }, () => Array(6).fill(this.EMPTY));
        this.heights = Array(7).fill(0);
        this.player = this.RED;
        this.status = this.ONGOING;
    }

    legalMoves() {
        return this.heights.map((height, index) => height < 6 ? index : null).filter(index => index !== null);
    }

    make(move) {
        this.board[move][this.heights[move]] = this.player;
        this.heights[move]++;
        if (this.winningMove(move)) {
            this.status = this.player;
        } else if (this.legalMoves().length === 0) {
            this.status = this.DRAW;
        } else {
            this.player = this.other(this.player);
        }
    }

    other(player) {
        return player === this.RED ? this.YELLOW : this.RED;
    }

    unmake(move) {
        this.heights[move]--;
        this.board[move][this.heights[move]] = this.EMPTY;
        this.player = this.other(this.player);
        this.status = this.ONGOING;
    }

    clone() {
        const clone = new ConnectFour();
        clone.board = this.board.map(col => [...col]); // Deep copy columns
        clone.heights = [...this.heights]; // Deep copy heights
        clone.player = this.player;
        clone.status = this.status;
        return clone;
    }

    winningMove(move) {
        const col = move;
        const row = this.heights[col] - 1; // Row of the last placed piece
        const player = this.board[col][row];

        // Check all four directions
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (const [dx, dy] of directions) {
            let count = 0;
            let x = col + dx, y = row + dy;
            while (x >= 0 && x < 7 && y >= 0 && y < 6 && this.board[x][y] === player) {
                count++;
                x += dx;
                y += dy;
            }
            x = col - dx;
            y = row - dy;
            while (x >= 0 && x < 7 && y >= 0 && y < 6 && this.board[x][y] === player) {
                count++;
                x -= dx;
                y -= dy;
            }
            if (count >= 3) return true;
        }
        return false;
    }

    toString() {
        const rows = [];
        for (let r = 5; r >= 0; r--) {
            const row = [];
            for (let c = 0; c < 7; c++) {
                if (this.board[c][r] === this.RED) {
                    row.push("R");
                } else if (this.board[c][r] === this.YELLOW) {
                    row.push("Y");
                } else {
                    row.push(".");
                }
            }
            rows.push(row.join(" "));
        }
        return rows.join("\n");
    }
}

const math = Math;

class MCTSNode {
    constructor(state, parent = null) {
        this.state = state; // Game state (a ConnectFour object)
        this.parent = parent;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.untriedMoves = [...state.legalMoves()]; // Moves not yet tried from this node
    }

    expand() {
        if (this.untriedMoves.length === 0) {
            throw new Error("No untried moves available to expand.");
        }

        const move = this.untriedMoves.pop();
        if (move < 0 || move >= 7 || this.state.heights[move] >= 6) {
            throw new Error(`Invalid move: ${move}`);
        }

        const nextState = this.state.clone();
        nextState.make(move);
        nextState.lastMove = move; // Track the move
        const childNode = new MCTSNode(nextState, this);
        this.children.push(childNode);
        return childNode;
    }

    bestChild(explorationParam = 1.41) {
        return this.children.reduce((best, child) => {
            const uctValue =
                child.wins / child.visits +
                explorationParam * Math.sqrt(Math.log(this.visits) / child.visits);
            return uctValue > (best.uct || -Infinity) ? { node: child, uct: uctValue } : best;
        }, { uct: -Infinity }).node;
    }

    update(result) {
        this.visits++;
        this.wins += result;
        if (this.parent) {
            this.parent.update(-result);
        }
    }
}

const random = Math.random;

export class MCTSPlayer {
    constructor(iterations = 1000, explorationParam = 1.41) {
        this.iterations = iterations;
        this.explorationParam = explorationParam;
    }

    chooseMove(game) {
        const root = new MCTSNode(game);

        // Check for immediate winning move
        for (const move of game.legalMoves()) {
            const testGame = game.clone();
            testGame.make(move);
            if (testGame.status === game.player) { // Check if this move results in a win
                return move;
            }
        }

        // Run MCTS iterations
        for (let i = 0; i < this.iterations; i++) {
            // Selection
            let node = root;
            while (node.untriedMoves.length === 0 && node.children.length > 0) {
                node = node.bestChild(this.explorationParam);
            }

            // Expansion
            if (node.untriedMoves.length > 0) {
                node = node.expand();
            }

            // Simulation
            const result = this.simulateGame(node.state.clone());

            // Backpropagation
            if (node.state.player === game.RED) {
                node.update(-result);
            } else {
                node.update(result);
            }
        }

        // Find the best move based on visits
        const bestChild = root.children.reduce((best, child) => 
            (child.visits > best.visits ? child : best), root.children[0]);

        // Identify the move that corresponds to the best child's state
        for (let i = 0; i < 7; i++) {
            if (game.board[i].toString() !== bestChild.state.board[i].toString()) {
                return i;
            }
        }

        throw new Error("Unable to determine the best move.");
    }

    simulateGame(state) {
        while (state.status === state.ONGOING) {
            const legalMoves = state.legalMoves();
            const move = legalMoves[Math.floor(random() * legalMoves.length)];
            state.make(move);
        }
        if (state.status === state.RED_WIN) {
            return 1;
        } else if (state.status === state.YELLOW_WIN) {
            return -1;
        } else {
            return 0;
        }
    }
}






// DOM Elements
const boardElement = document.getElementById('board');
const gameModeSelect = document.getElementById('game-mode');
const startButton = document.getElementById('start-game');
const gameStatusElement = document.getElementById('game-status');
const restartButton = document.getElementById('restart-button');

// Global Variables
let game;
let gameMode;
let currentPlayer;
let mctsPlayer;

// Initiali

// Initialize the game board
function drawBoard() {
    boardElement.innerHTML = '';
    boardElement.style.display = 'grid';
    boardElement.style.gridTemplateColumns = 'repeat(7, 1fr)'; // Responsive columns
    boardElement.style.gap = '5px'; // Gap between cells
    boardElement.style.width = '90%'; // Adjust the board width
    boardElement.style.maxWidth = '600px'; // Limit the maximum width
    boardElement.style.margin = '0 auto'; // Center the board

    for (let row = 5; row >= 0; row--) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.dataset.col = col;
            cell.dataset.row = row;
            cell.style.aspectRatio = '1'; // Ensure cells are square
            cell.style.backgroundColor = 'blue';
            cell.style.borderRadius = '50%';
            cell.style.position = 'relative';
            const circle = document.createElement('div');
            circle.style.width = '80%'; // Proportional size for inner circle
            circle.style.height = '80%';
            circle.style.backgroundColor = 'white';
            circle.style.borderRadius = '50%';
            circle.style.position = 'absolute';
            circle.style.top = '50%';
            circle.style.left = '50%';
            circle.style.transform = 'translate(-50%, -50%)';
            cell.appendChild(circle);
            boardElement.appendChild(cell);

            cell.addEventListener('click', () => handleCellClick(col));
        }
    }
}


// Draw a piece in the specified column
function draw(col) {
    const row = game.heights[col] - 1;
    const cell = document.querySelector(`[data-col="${col}"][data-row="${row}"]`);
    if (cell) {
        const piece = game.board[col][row];
        cell.firstChild.style.backgroundColor = piece === game.RED ? 'red' : 'yellow';
    }
}



// Handle cell click for Human players
function handleCellClick(col) {
    if (gameMode === 'human_vs_human' && game.legalMoves().includes(col)) {
        // Human vs Human mode
        game.make(col);
        draw(col);
        checkGameStatus();

        if (game.status === game.ONGOING) {
            currentPlayer = game.other(currentPlayer); // Switch turns
        }
    } else if (gameMode === 'human_vs_ai' && currentPlayer === game.YELLOW && game.legalMoves().includes(col)) {
        // Human vs AI mode: Human's (Yellow) turn
        game.make(col);
        draw(col);
        checkGameStatus();

        if (game.status === game.ONGOING) {
            currentPlayer = game.RED;
            setTimeout(aiMove, 500); // Allow AI to make its move
        }
    }
}

// AI makes a move
function aiMove() {
    if (gameMode === 'human_vs_ai' && currentPlayer === game.RED && game.status === game.ONGOING) {
        const move = mctsPlayer.chooseMove(game);
        if (game.legalMoves().includes(move)) {
            game.make(move);
            draw(move);
            checkGameStatus();

            if (game.status === game.ONGOING) {
                currentPlayer = game.YELLOW; // Switch back to Human
            }
        } else {
            console.error(`AI chose an illegal move: ${move}`);
        }
    }
}


function playAIvsAI() {
    const aiPlayer1 = new MCTSPlayer(15000, 1.41); // Red AI
    const aiPlayer2 = new MCTSPlayer(1000, 1.32); // Yellow AI

    function aiTurn() {
        if (game.status === game.ONGOING) {
            const currentAI = currentPlayer === game.RED ? aiPlayer1 : aiPlayer2;
            const move = currentAI.chooseMove(game);

            if (game.legalMoves().includes(move)) {
                game.make(move);
                draw(move);
                checkGameStatus();

                if (game.status === game.ONGOING) {
                    currentPlayer = game.other(currentPlayer); // Switch turns
                    setTimeout(aiTurn, 500); // Delay for the next AI move
                }
            } else {
                console.error(`AI chose an illegal move: ${move}`);
            }
        }
    }

    aiTurn(); // Start the AI vs AI game
}




// Check game status
function checkGameStatus() {
    if (game.status === game.RED_WIN) {
        gameStatusElement.textContent = gameMode === 'human_vs_ai' ? 'Red (AI) wins!' : 'Red wins!';
        restartButton.style.display = 'block';
    } else if (game.status === game.YELLOW_WIN) {
        gameStatusElement.textContent = gameMode === 'human_vs_ai' ? 'Yellow (Player) wins!' : 'Yellow wins!';
        restartButton.style.display = 'block';
    } else if (game.status === game.DRAW) {
        gameStatusElement.textContent = 'It\'s a draw!';
        restartButton.style.display = 'block';
    } else {
        gameStatusElement.textContent = currentPlayer === game.RED?  (gameMode === 'human_vs_ai' ? 'Red (AI)\'s turn' : 'yellow\'s turn')  : 'red\'s turn';
    }
}
function startGame() {
    game = new ConnectFour();
    mctsPlayer = new MCTSPlayer(1000, 1.41);
    gameMode = gameModeSelect.value;

    if (gameMode === 'human_vs_ai') {
        currentPlayer = game.RED; // AI starts in Human vs AI mode
        gameStatusElement.textContent = 'Game started! Red (AI) starts.';
        drawBoard();
        setTimeout(aiMove, 500); // AI makes the first move
    } else if (gameMode === 'human_vs_human') {
        currentPlayer = game.RED; // Red starts in Human vs Human mode
        gameStatusElement.textContent = 'Game started! Red\'s turn.';
        drawBoard();
    } else if (gameMode === 'ai_vs_ai') {
        currentPlayer = game.RED; // Red AI starts
        gameStatusElement.textContent = 'Game started! AI vs AI in progress.';
        drawBoard();
        setTimeout(playAIvsAI, 500); // Start the AI vs AI game
    }

    restartButton.style.display = 'none';
}
// Restart game
restartButton.addEventListener('click', startGame);

// Enable start button when a game mode is selected
gameModeSelect.addEventListener('change', () => {
    startButton.disabled = gameModeSelect.value === '';
});

// Start game on button click
startButton.addEventListener('click', startGame);

// Draw initial empty board
drawBoard();
