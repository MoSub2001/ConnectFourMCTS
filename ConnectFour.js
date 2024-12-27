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

