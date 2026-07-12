(() => {
    const modal = document.getElementById('chessGameModal');
    if (!modal) return;

    const boardElement = document.getElementById('chessBoard');
    const startScreen = document.getElementById('chessStartScreen');
    const endScreen = document.getElementById('chessEndScreen');
    const infoPanel = document.getElementById('chessInfoPanel');
    const turnLabel = document.getElementById('chessTurn');
    const scoreLabel = document.getElementById('chessScore');
    const whiteCaptures = document.getElementById('whiteCaptures');
    const blackCaptures = document.getElementById('blackCaptures');
    const endTitle = document.getElementById('chessEndTitle');
    const endText = document.getElementById('chessEndText');
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const labels = { p: 'Piyon', n: 'At', b: 'Fil', r: 'Kale', q: 'Vezir', k: 'Şah' };
    const images = {
        w: { b: 'gorseller/wB.png', k: 'gorseller/wK.png', n: 'gorseller/wN.png', p: 'gorseller/wP.png', q: 'gorseller/wQ.png', r: 'gorseller/wR.png' },
        b: { b: 'gorseller/bB.png', k: 'gorseller/bK.png', n: 'gorseller/bN.png', p: 'gorseller/bP.png', q: 'gorseller/bQ.png', r: 'gorseller/bR.png' }
    };
    let board, selected, validMoves, turn, active, thinking, whiteTaken, blackTaken;

    const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const opponent = (color) => color === 'w' ? 'b' : 'w';
    const copyBoard = (source) => source.map(row => row.map(piece => piece ? { ...piece } : null));
    const initialBoard = () => {
        const empty = Array.from({ length: 8 }, () => Array(8).fill(null));
        const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        back.forEach((type, col) => { empty[0][col] = { type, color: 'b' }; empty[7][col] = { type, color: 'w' }; });
        for (let col = 0; col < 8; col += 1) { empty[1][col] = { type: 'p', color: 'b' }; empty[6][col] = { type: 'p', color: 'w' }; }
        return empty;
    };
    const key = (r, c) => `${r}-${c}`;
    const findKing = (state, color) => {
        for (let r = 0; r < 8; r += 1) for (let c = 0; c < 8; c += 1) if (state[r][c]?.color === color && state[r][c].type === 'k') return { r, c };
        return null;
    };
    function pseudoMoves(state, r, c, attackOnly = false) {
        const piece = state[r][c]; if (!piece) return [];
        const moves = []; const add = (row, col) => { if (!inside(row, col)) return false; const target = state[row][col]; if (!target) { moves.push({ r: row, c: col }); return true; } if (target.color !== piece.color) moves.push({ r: row, c: col }); return false; };
        if (piece.type === 'p') {
            const dir = piece.color === 'w' ? -1 : 1; const start = piece.color === 'w' ? 6 : 1;
            [-1, 1].forEach(dc => { const nr = r + dir, nc = c + dc; if (inside(nr, nc) && (attackOnly || (state[nr][nc] && state[nr][nc].color !== piece.color))) moves.push({ r: nr, c: nc }); });
            if (!attackOnly && inside(r + dir, c) && !state[r + dir][c]) { moves.push({ r: r + dir, c }); if (r === start && !state[r + dir * 2][c]) moves.push({ r: r + dir * 2, c }); }
            return moves;
        }
        if (piece.type === 'n') { [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => add(r + dr, c + dc)); return moves; }
        if (piece.type === 'k') { for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) if (dr || dc) add(r + dr, c + dc); return moves; }
        const directions = piece.type === 'b' ? [[-1,-1],[-1,1],[1,-1],[1,1]] : piece.type === 'r' ? [[-1,0],[1,0],[0,-1],[0,1]] : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
        directions.forEach(([dr, dc]) => { let nr = r + dr, nc = c + dc; while (inside(nr, nc)) { const canContinue = add(nr, nc); if (!canContinue) break; nr += dr; nc += dc; } });
        return moves;
    }
    function inCheck(state, color) {
        const king = findKing(state, color); if (!king) return true;
        const enemy = opponent(color);
        for (let r = 0; r < 8; r += 1) for (let c = 0; c < 8; c += 1) if (state[r][c]?.color === enemy && pseudoMoves(state, r, c, true).some(move => move.r === king.r && move.c === king.c)) return true;
        return false;
    }
    function applyMove(state, move) {
        const next = copyBoard(state); const piece = next[move.from.r][move.from.c]; const captured = next[move.to.r][move.to.c];
        next[move.to.r][move.to.c] = { ...piece, type: piece.type === 'p' && (move.to.r === 0 || move.to.r === 7) ? 'q' : piece.type };
        next[move.from.r][move.from.c] = null; return { board: next, captured };
    }
    function legalMovesFor(state, r, c) {
        const piece = state[r][c]; if (!piece) return [];
        return pseudoMoves(state, r, c).filter(to => !inCheck(applyMove(state, { from: { r, c }, to }).board, piece.color)).map(to => ({ from: { r, c }, to }));
    }
    function allMoves(state, color) { const moves = []; for (let r = 0; r < 8; r += 1) for (let c = 0; c < 8; c += 1) if (state[r][c]?.color === color) moves.push(...legalMovesFor(state, r, c)); return moves; }
    function evaluate(state) {
        let score = 0;
        for (let r = 0; r < 8; r += 1) for (let c = 0; c < 8; c += 1) { const piece = state[r][c]; if (!piece) continue; const center = 3.5 - Math.abs(3.5 - c) + 3.5 - Math.abs(3.5 - r); const amount = values[piece.type] + (piece.type === 'p' ? (piece.color === 'b' ? r : 7 - r) * .08 : center * .035); score += piece.color === 'b' ? amount : -amount; }
        return score;
    }
    function computerMove() {
        const candidates = allMoves(board, 'b'); if (!candidates.length) return null;
        let best = -Infinity, selectedMoves = [];
        candidates.forEach(move => {
            const afterBlack = applyMove(board, move).board;
            const replies = allMoves(afterBlack, 'w');
            let value = replies.length ? Math.min(...replies.map(reply => evaluate(applyMove(afterBlack, reply).board))) : (inCheck(afterBlack, 'w') ? 1000 : 0);
            if (move.to && board[move.to.r][move.to.c]) value += values[board[move.to.r][move.to.c].type] * .16;
            if (value > best + .08) { best = value; selectedMoves = [move]; } else if (Math.abs(value - best) <= .08) selectedMoves.push(move);
        });
        return selectedMoves[Math.floor(Math.random() * selectedMoves.length)];
    }
    function counts(items) { if (!items.length) return 'Henüz taş alınmadı.'; const data = items.reduce((acc, type) => ({ ...acc, [type]: (acc[type] || 0) + 1 }), {}); return Object.entries(data).map(([type, count]) => `${labels[type]} (x${count})`).join(' · '); }
    function updateSide(message) { turnLabel.textContent = message; scoreLabel.textContent = whiteTaken.reduce((total, type) => total + values[type], 0); whiteCaptures.textContent = counts(whiteTaken); blackCaptures.textContent = counts(blackTaken); }
    function render() {
        boardElement.innerHTML = '';
        const legal = new Set(validMoves.map(move => key(move.to.r, move.to.c)));
        board.forEach((row, r) => row.forEach((piece, c) => {
            const square = document.createElement('button'); square.type = 'button'; square.className = `chess-square ${(r + c) % 2 ? 'dark' : 'light'}`;
            if (selected?.r === r && selected?.c === c) square.classList.add('selected');
            if (legal.has(key(r,c))) square.classList.add(piece ? 'capture' : 'legal');
            square.setAttribute('aria-label', piece ? `${piece.color === 'w' ? 'Beyaz' : 'Siyah'} ${labels[piece.type]}` : 'Boş kare');
            if (piece) { const image = document.createElement('img'); image.className = 'chess-piece'; image.src = images[piece.color][piece.type]; image.alt = ''; square.appendChild(image); }
            square.addEventListener('click', () => clickSquare(r, c)); boardElement.appendChild(square);
        }));
    }
    function finish(won, detail) { active = false; thinking = false; endTitle.textContent = won ? 'Tebrikler, kazandınız!' : 'Kaybettiniz'; endText.textContent = detail; endScreen.hidden = false; }
    function assess(colorJustMoved) {
        const nextColor = opponent(colorJustMoved); const moves = allMoves(board, nextColor); const checked = inCheck(board, nextColor);
        if (!moves.length) { if (checked) finish(colorJustMoved === 'w', colorJustMoved === 'w' ? 'Şah mat! Rakibin şahını köşeye sıkıştırdın.' : 'Şah mat. Rakibin şahın için kaçış bırakmadı.'); else { active = false; endTitle.textContent = 'Berabere'; endText.textContent = 'Pat durumu oluştu.'; endScreen.hidden = false; } return true; }
        updateSide(checked ? (nextColor === 'w' ? 'Şah mat tehdidi: sıra sizde' : 'Şah mat tehdidi: sıra rakipte') : (nextColor === 'w' ? 'Sıra sizde' : 'Sıra rakipte'));
        return false;
    }
    function makeMove(move) {
        const result = applyMove(board, move); const moving = board[move.from.r][move.from.c]; board = result.board;
        if (result.captured) (moving.color === 'w' ? whiteTaken : blackTaken).push(result.captured.type);
        selected = null; validMoves = []; render(); return moving.color;
    }
    function takeComputerTurn() {
        thinking = true; updateSide('Sıra rakipte — düşünüyor...');
        window.setTimeout(() => { if (!active) return; const move = computerMove(); if (!move) { assess('w'); return; } makeMove(move); turn = 'w'; thinking = false; if (!assess('b')) render(); }, 520);
    }
    function clickSquare(r, c) {
        if (!active || thinking || turn !== 'w') return;
        const piece = board[r][c]; const matching = validMoves.find(move => move.to.r === r && move.to.c === c);
        if (matching) { makeMove(matching); turn = 'b'; if (!assess('w')) takeComputerTurn(); return; }
        if (piece?.color === 'w') { selected = { r, c }; validMoves = legalMovesFor(board, r, c); render(); }
        else { selected = null; validMoves = []; render(); }
    }
    function reset() { board = initialBoard(); selected = null; validMoves = []; turn = 'w'; active = true; thinking = false; whiteTaken = []; blackTaken = []; endScreen.hidden = true; updateSide('Sıra sizde'); render(); }
    function open() { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('game-open'); reset(); startScreen.hidden = false; document.getElementById('startChessGame').focus(); }
    function close() { active = false; modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('game-open'); }
    document.getElementById('openChessGame').addEventListener('click', open);
    document.getElementById('closeChessGame').addEventListener('click', close);
    document.getElementById('startChessGame').addEventListener('click', () => { startScreen.hidden = true; updateSide('Sıra sizde'); });
    document.getElementById('restartChessGame').addEventListener('click', reset);
    document.getElementById('openChessInfo').addEventListener('click', () => { infoPanel.hidden = false; });
    document.getElementById('closeChessInfo').addEventListener('click', () => { infoPanel.hidden = true; });
    window.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('is-open')) close(); });
})();
