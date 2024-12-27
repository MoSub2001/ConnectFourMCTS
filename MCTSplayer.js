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

module.exports = MCTSPlayer;
