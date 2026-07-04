import { useState, useEffect } from 'react';
import { Flag, Bomb, RotateCcw, Clock } from 'lucide-react';

const DIFFICULTY = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

export default function Minesweeper({ onBack, isDark }) {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [minesCount, setMinesCount] = useState(DIFFICULTY.easy.mines);
  const [time, setTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [isFirstClick, setIsFirstClick] = useState(true);

  const { rows, cols, mines } = DIFFICULTY[difficulty];

  const createEmptyBoard = () => {
    const newBoard = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }
    return newBoard;
  };

  const placeMines = (excludeRow, excludeCol) => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    let placedMines = 0;
    
    while (placedMines < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;
      
      if (!newBoard[r][c].isMine && !isExcluded) {
        newBoard[r][c].isMine = true;
        placedMines++;
      }
    }
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }
    
    return newBoard;
  };

  const initGame = () => {
    setBoard(createEmptyBoard());
    setTime(0);
    setGameStatus('playing');
    setFlaggedCount(0);
    setIsFirstClick(true);
    setMinesCount(DIFFICULTY[difficulty].mines);
  };

  useEffect(() => {
    initGame();
  }, [difficulty]);

  useEffect(() => {
    let timer;
    if (gameStatus === 'playing' && !isFirstClick) {
      timer = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus, isFirstClick]);

  const revealCell = (startR, startC, currentBoard) => {
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    const visited = new Set();
    const queue = [{ r: startR, c: startC }];

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const key = `${r}-${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;

      const cell = newBoard[r][c];
      if (cell.isRevealed || cell.isFlagged) continue;

      visited.add(key);
      newBoard[r][c].isRevealed = true;

      if (newBoard[r][c].isMine) {
        return { board: newBoard, hitMine: true };
      }

      if (newBoard[r][c].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) {
              const newKey = `${r + dr}-${c + dc}`;
              if (!visited.has(newKey)) {
                queue.push({ r: r + dr, c: c + dc });
              }
            }
          }
        }
      }
    }

    return { board: newBoard, hitMine: false };
  };

  const checkWin = (currentBoard) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!currentBoard[r][c].isMine && !currentBoard[r][c].isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (r, c) => {
    if (gameStatus !== 'playing') return;
    const cell = board[r][c];
    if (cell.isFlagged || cell.isRevealed) return;

    let currentBoard = board;
    
    if (isFirstClick) {
      currentBoard = placeMines(r, c);
      setIsFirstClick(false);
    }

    const result = revealCell(r, c, currentBoard);

    if (result.hitMine) {
      const finalBoard = result.board.map(row => row.map(cell => ({ ...cell })));
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (finalBoard[i][j].isMine) {
            finalBoard[i][j].isRevealed = true;
          }
        }
      }
      setBoard(finalBoard);
      setGameStatus('lost');
      return;
    }

    setBoard(result.board);

    if (checkWin(result.board)) {
      setGameStatus('won');
    }
  };

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    if (gameStatus !== 'playing') return;
    const cell = board[r][c];
    if (cell.isRevealed) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
    setFlaggedCount(prev => newBoard[r][c].isFlagged ? prev + 1 : prev - 1);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNumberColor = (num) => {
    const colors = {
      1: 'text-blue-500',
      2: 'text-green-500',
      3: 'text-red-500',
      4: 'text-purple-700',
      5: 'text-red-800',
      6: 'text-cyan-600',
      7: 'text-black',
      8: 'text-gray-600',
    };
    return colors[num] || '';
  };

  return (
    <div className={`min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
      <div className={`w-full max-w-fit rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-start mb-4">
          <button onClick={onBack} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
            <RotateCcw className="w-4 h-4" />
            返回仪表盘
          </button>
        </div>
      <div>
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className={`flex items-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-gray-800'} text-red-500 px-3 py-2 rounded-lg font-mono text-xl font-bold min-w-[80px]`}>
            <Flag className="w-5 h-5" />
            {mines - flaggedCount}
          </div>

          <button onClick={initGame} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            <RotateCcw className="w-4 h-4" />
            新游戏
          </button>

          <div className={`flex items-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-gray-800'} text-green-500 px-3 py-2 rounded-lg font-mono text-xl font-bold min-w-[100px]`}>
            <Clock className="w-5 h-5" />
            {formatTime(time)}
          </div>
        </div>

        <div className="overflow-auto max-w-full" style={{ maxHeight: '500px' }}>
          <div className={`grid gap-px p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-400'}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, width: `${cols * 28}px` }}>
            {board.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  className={`w-7 h-7 flex items-center justify-center text-sm font-bold transition-all border border-gray-400 ${
                    cell.isRevealed
                      ? cell.isMine
                        ? 'bg-red-500 text-white'
                        : isDark ? 'bg-gray-600' : 'bg-gray-200'
                      : isDark ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-4 h-4" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                    ) : null
                  ) : cell.isFlagged ? (
                    <Flag className="w-4 h-4 text-red-500" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        {gameStatus !== 'playing' && (
          <div className={`mt-4 p-4 rounded-lg text-center font-bold text-lg ${gameStatus === 'won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {gameStatus === 'won' ? '恭喜你赢了！' : '游戏结束！'}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-4">
          {['easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                difficulty === level
                  ? level === 'easy' ? 'bg-blue-500 text-white'
                    : level === 'medium' ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                  : level === 'easy' ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : level === 'medium' ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              {level === 'easy' ? '简单' : level === 'medium' ? '中等' : '困难'}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
