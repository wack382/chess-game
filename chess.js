class Piece {
    constructor(type, color) {
        this.type = type; // 'pawn', 'rook', 'knight', 'bishop', 'queen', 'king'
        this.color = color; // 'white', 'black'
    }

    get symbol() {
        const symbols = {
            white: {
                pawn: '♙',
                rook: '♖',
                knight: '♘',
                bishop: '♗',
                queen: '♕',
                king: '♔'
            },
            black: {
                pawn: '♟',
                rook: '♜',
                knight: '♞',
                bishop: '♝',
                queen: '♛',
                king: '♚'
            }
        };
        return symbols[this.color][this.type];
    }
}

class Chess {
    constructor() {
        this.board = this.initializeBoard();
        this.boardHistory = [JSON.parse(JSON.stringify(this.board))];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.whiteKingMoved = false;
        this.blackKingMoved = false;
        this.whiteRookKingMoved = false;
        this.whiteRookQueenMoved = false;
        this.blackRookKingMoved = false;
        this.blackRookQueenMoved = false;
        this.lastMove = null;
    }

    initializeBoard() {
        const board = {};
        
        // Setup pawns
        for (let i = 0; i < 8; i++) {
            const col = String.fromCharCode(97 + i);
            board[col + '2'] = new Piece('pawn', 'white');
            board[col + '7'] = new Piece('pawn', 'black');
        }

        // Setup other pieces - white
        board['a1'] = new Piece('rook', 'white');
        board['b1'] = new Piece('knight', 'white');
        board['c1'] = new Piece('bishop', 'white');
        board['d1'] = new Piece('queen', 'white');
        board['e1'] = new Piece('king', 'white');
        board['f1'] = new Piece('bishop', 'white');
        board['g1'] = new Piece('knight', 'white');
        board['h1'] = new Piece('rook', 'white');

        // Setup other pieces - black
        board['a8'] = new Piece('rook', 'black');
        board['b8'] = new Piece('knight', 'black');
        board['c8'] = new Piece('bishop', 'black');
        board['d8'] = new Piece('queen', 'black');
        board['e8'] = new Piece('king', 'black');
        board['f8'] = new Piece('bishop', 'black');
        board['g8'] = new Piece('knight', 'black');
        board['h8'] = new Piece('rook', 'black');

        return board;
    }

    getPieceAt(square) {
        return this.board[square] || null;
    }

    isValidSquare(square) {
        const col = square.charCodeAt(0) - 97;
        const row = parseInt(square[1]) - 1;
        return col >= 0 && col < 8 && row >= 0 && row < 8;
    }

    getValidMoves(square) {
        const piece = this.getPieceAt(square);
        if (!piece || piece.color !== this.currentPlayer) {
            return [];
        }

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(square);
                break;
            case 'rook':
                moves = this.getRookMoves(square);
                break;
            case 'knight':
                moves = this.getKnightMoves(square);
                break;
            case 'bishop':
                moves = this.getBishopMoves(square);
                break;
            case 'queen':
                moves = this.getQueenMoves(square);
                break;
            case 'king':
                moves = this.getKingMoves(square);
                break;
        }

        // Filter out moves that would leave the king in check
        return moves.filter(move => !this.wouldLeaveKingInCheck(square, move));
    }

    getPawnMoves(square) {
        const piece = this.getPieceAt(square);
        const col = square.charCodeAt(0);
        const row = parseInt(square[1]);
        const moves = [];
        const direction = piece.color === 'white' ? 1 : -1;
        const startRow = piece.color === 'white' ? 2 : 7;

        // Forward move
        const forwardSquare = String.fromCharCode(col) + (row + direction);
        if (this.isValidSquare(forwardSquare) && !this.getPieceAt(forwardSquare)) {
            moves.push(forwardSquare);

            // Double move from start
            if (row === startRow) {
                const doubleSquare = String.fromCharCode(col) + (row + 2 * direction);
                if (!this.getPieceAt(doubleSquare)) {
                    moves.push(doubleSquare);
                }
            }
        }

        // Capture diagonally
        [-1, 1].forEach(colOffset => {
            const captureSquare = String.fromCharCode(col + colOffset) + (row + direction);
            if (this.isValidSquare(captureSquare)) {
                const targetPiece = this.getPieceAt(captureSquare);
                if (targetPiece && targetPiece.color !== piece.color) {
                    moves.push(captureSquare);
                }
            }
        });

        return moves;
    }

    getRookMoves(square) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.addDirectionalMoves(square, directions, moves);
        return moves;
    }

    getKnightMoves(square) {
        const col = square.charCodeAt(0) - 97;
        const row = parseInt(square[1]) - 1;
        const moves = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        offsets.forEach(([colOffset, rowOffset]) => {
            const newCol = col + colOffset;
            const newRow = row + rowOffset;
            if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                const targetSquare = String.fromCharCode(97 + newCol) + (newRow + 1);
                const targetPiece = this.getPieceAt(targetSquare);
                if (!targetPiece || targetPiece.color !== this.getPieceAt(square).color) {
                    moves.push(targetSquare);
                }
            }
        });

        return moves;
    }

    getBishopMoves(square) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.addDirectionalMoves(square, directions, moves);
        return moves;
    }

    getQueenMoves(square) {
        const moves = [];
        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        this.addDirectionalMoves(square, directions, moves);
        return moves;
    }

    getKingMoves(square) {
        const col = square.charCodeAt(0) - 97;
        const row = parseInt(square[1]) - 1;
        const moves = [];
        const piece = this.getPieceAt(square);

        for (let colOffset = -1; colOffset <= 1; colOffset++) {
            for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                if (colOffset === 0 && rowOffset === 0) continue;

                const newCol = col + colOffset;
                const newRow = row + rowOffset;
                if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                    const targetSquare = String.fromCharCode(97 + newCol) + (newRow + 1);
                    const targetPiece = this.getPieceAt(targetSquare);
                    if (!targetPiece || targetPiece.color !== piece.color) {
                        moves.push(targetSquare);
                    }
                }
            }
        }

        // Castling
        if (!this.isInCheck()) {
            if (piece.color === 'white') {
                // King-side castling
                if (!this.whiteKingMoved && !this.whiteRookKingMoved) {
                    if (!this.getPieceAt('f1') && !this.getPieceAt('g1')) {
                        if (!this.isSquareUnderAttack('f1', 'black')) {
                            moves.push('g1');
                        }
                    }
                }
                // Queen-side castling
                if (!this.whiteKingMoved && !this.whiteRookQueenMoved) {
                    if (!this.getPieceAt('b1') && !this.getPieceAt('c1') && !this.getPieceAt('d1')) {
                        if (!this.isSquareUnderAttack('d1', 'black')) {
                            moves.push('c1');
                        }
                    }
                }
            } else {
                // King-side castling
                if (!this.blackKingMoved && !this.blackRookKingMoved) {
                    if (!this.getPieceAt('f8') && !this.getPieceAt('g8')) {
                        if (!this.isSquareUnderAttack('f8', 'white')) {
                            moves.push('g8');
                        }
                    }
                }
                // Queen-side castling
                if (!this.blackKingMoved && !this.blackRookQueenMoved) {
                    if (!this.getPieceAt('b8') && !this.getPieceAt('c8') && !this.getPieceAt('d8')) {
                        if (!this.isSquareUnderAttack('d8', 'white')) {
                            moves.push('c8');
                        }
                    }
                }
            }
        }

        return moves;
    }

    addDirectionalMoves(square, directions, moves) {
        const piece = this.getPieceAt(square);
        const col = square.charCodeAt(0) - 97;
        const row = parseInt(square[1]) - 1;

        directions.forEach(([colOffset, rowOffset]) => {
            let newCol = col + colOffset;
            let newRow = row + rowOffset;

            while (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                const targetSquare = String.fromCharCode(97 + newCol) + (newRow + 1);
                const targetPiece = this.getPieceAt(targetSquare);

                if (!targetPiece) {
                    moves.push(targetSquare);
                } else {
                    if (targetPiece.color !== piece.color) {
                        moves.push(targetSquare);
                    }
                    break;
                }

                newCol += colOffset;
                newRow += rowOffset;
            }
        });
    }

    movePiece(from, to) {
        const piece = this.getPieceAt(from);
        if (!piece) return false;

        const validMoves = this.getValidMoves(from);
        if (!validMoves.includes(to)) return false;

        let moveNotation = '';

        // Handle castling
        if (piece.type === 'king') {
            if (piece.color === 'white') {
                this.whiteKingMoved = true;
                if (from === 'e1' && to === 'g1') {
                    // King-side castling
                    const rook = this.getPieceAt('h1');
                    this.board['f1'] = rook;
                    delete this.board['h1'];
                    moveNotation = 'O-O';
                } else if (from === 'e1' && to === 'c1') {
                    // Queen-side castling
                    const rook = this.getPieceAt('a1');
                    this.board['d1'] = rook;
                    delete this.board['a1'];
                    moveNotation = 'O-O-O';
                } else {
                    moveNotation = this.getMoveNotation(from, to);
                }
            } else {
                this.blackKingMoved = true;
                if (from === 'e8' && to === 'g8') {
                    // King-side castling
                    const rook = this.getPieceAt('h8');
                    this.board['f8'] = rook;
                    delete this.board['h8'];
                    moveNotation = 'O-O';
                } else if (from === 'e8' && to === 'c8') {
                    // Queen-side castling
                    const rook = this.getPieceAt('a8');
                    this.board['d8'] = rook;
                    delete this.board['a8'];
                    moveNotation = 'O-O-O';
                } else {
                    moveNotation = this.getMoveNotation(from, to);
                }
            }
        }

        // Track rook moves for castling
        if (piece.type === 'rook') {
            if (piece.color === 'white') {
                if (from === 'a1') this.whiteRookQueenMoved = true;
                if (from === 'h1') this.whiteRookKingMoved = true;
            } else {
                if (from === 'a8') this.blackRookQueenMoved = true;
                if (from === 'h8') this.blackRookKingMoved = true;
            }
        }

        // Handle pawn promotion
        if (piece.type === 'pawn') {
            if ((piece.color === 'white' && parseInt(to[1]) === 8) ||
                (piece.color === 'black' && parseInt(to[1]) === 1)) {
                this.board[to] = new Piece('queen', piece.color);
                delete this.board[from];
                moveNotation = this.getMoveNotation(from, to) + '=Q';
                this.moveHistory.push(moveNotation);
                this.boardHistory.push(JSON.parse(JSON.stringify(this.board)));
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.lastMove = { from, to };
                return true;
            }
        }

        // Regular move
        this.board[to] = piece;
        delete this.board[from];

        // Add move notation if not already set (for non-castling moves)
        if (!moveNotation) {
            moveNotation = this.getMoveNotation(from, to);
        }

        this.moveHistory.push(moveNotation);
        this.boardHistory.push(JSON.parse(JSON.stringify(this.board)));
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.lastMove = { from, to };
        return true;
    }

    getMoveNotation(from, to) {
        const targetPiece = this.getPieceAt(to);
        const piece = this.getPieceAt(from);
        let notation = '';

        if (piece.type !== 'pawn') {
            notation += piece.type[0].toUpperCase();
        }

        if (targetPiece) {
            notation += 'x';
        }

        notation += to;
        return notation;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        // Remove the last move from history
        this.moveHistory.pop();
        
        // Restore the previous board state
        this.boardHistory.pop();
        this.board = JSON.parse(JSON.stringify(this.boardHistory[this.boardHistory.length - 1]));
        
        // Switch current player back
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Reset game over status
        this.gameOver = false;
        
        // Reset castling rights (simplified - would need full state tracking for complete correctness)
        this.resetCastlingRights();
    }

    resetCastlingRights() {
        // Check if kings/rooks are still in original positions
        this.whiteKingMoved = !this.getPieceAt('e1') || this.getPieceAt('e1').type !== 'king';
        this.blackKingMoved = !this.getPieceAt('e8') || this.getPieceAt('e8').type !== 'king';
        this.whiteRookKingMoved = !this.getPieceAt('h1') || this.getPieceAt('h1').type !== 'rook';
        this.whiteRookQueenMoved = !this.getPieceAt('a1') || this.getPieceAt('a1').type !== 'rook';
        this.blackRookKingMoved = !this.getPieceAt('h8') || this.getPieceAt('h8').type !== 'rook';
        this.blackRookQueenMoved = !this.getPieceAt('a8') || this.getPieceAt('a8').type !== 'rook';
    }

    isInCheck() {
        const king = this.findKing(this.currentPlayer);
        return this.isSquareUnderAttack(king, this.currentPlayer === 'white' ? 'black' : 'white');
    }

    isCheckmate() {
        if (!this.isInCheck()) return false;

        for (let col = 97; col < 105; col++) {
            for (let row = 1; row <= 8; row++) {
                const square = String.fromCharCode(col) + row;
                const piece = this.getPieceAt(square);
                if (piece && piece.color === this.currentPlayer) {
                    if (this.getValidMoves(square).length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    isStalemate() {
        if (this.isInCheck()) return false;

        for (let col = 97; col < 105; col++) {
            for (let row = 1; row <= 8; row++) {
                const square = String.fromCharCode(col) + row;
                const piece = this.getPieceAt(square);
                if (piece && piece.color === this.currentPlayer) {
                    if (this.getValidMoves(square).length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    findKing(color) {
        for (let col = 97; col < 105; col++) {
            for (let row = 1; row <= 8; row++) {
                const square = String.fromCharCode(col) + row;
                const piece = this.getPieceAt(square);
                if (piece && piece.type === 'king' && piece.color === color) {
                    return square;
                }
            }
        }
        return null;
    }

    isSquareUnderAttack(square, byColor) {
        for (let col = 97; col < 105; col++) {
            for (let row = 1; row <= 8; row++) {
                const pieceSquare = String.fromCharCode(col) + row;
                const piece = this.getPieceAt(pieceSquare);
                if (piece && piece.color === byColor) {
                    const moves = this.getAttackSquares(pieceSquare);
                    if (moves.includes(square)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getAttackSquares(square) {
        const piece = this.getPieceAt(square);
        if (!piece) return [];

        let moves = [];
        const directions = [];

        switch (piece.type) {
            case 'pawn':
                const col = square.charCodeAt(0);
                const row = parseInt(square[1]);
                const direction = piece.color === 'white' ? 1 : -1;
                [-1, 1].forEach(offset => {
                    const attackSquare = String.fromCharCode(col + offset) + (row + direction);
                    if (this.isValidSquare(attackSquare)) {
                        moves.push(attackSquare);
                    }
                });
                break;
            case 'rook':
                return this.getRookMoves(square);
            case 'knight':
                return this.getKnightMoves(square);
            case 'bishop':
                return this.getBishopMoves(square);
            case 'queen':
                return this.getQueenMoves(square);
            case 'king':
                const kingCol = square.charCodeAt(0) - 97;
                const kingRow = parseInt(square[1]) - 1;
                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colOffset === 0 && rowOffset === 0) continue;
                        const newCol = kingCol + colOffset;
                        const newRow = kingRow + rowOffset;
                        if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                            moves.push(String.fromCharCode(97 + newCol) + (newRow + 1));
                        }
                    }
                }
                break;
        }

        return moves;
    }

    wouldLeaveKingInCheck(from, to) {
        const piece = this.getPieceAt(from);
        const capturedPiece = this.getPieceAt(to);

        // Simulate move
        this.board[to] = piece;
        delete this.board[from];

        const king = piece.type === 'king' ? to : this.findKing(piece.color);
        const isCheck = this.isSquareUnderAttack(king, piece.color === 'white' ? 'black' : 'white');

        // Undo simulation
        this.board[from] = piece;
        if (capturedPiece) {
            this.board[to] = capturedPiece;
        } else {
            delete this.board[to];
        }

        return isCheck;
    }
}
