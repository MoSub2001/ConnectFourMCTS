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

