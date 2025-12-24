// js/caca-palavras.js

// Definições dos níveis de dificuldade
const DIFFICULTIES = {
    easy: { size: 10, wordCount: 5, cellSize: '30px', mobileSize: '24px' },
    medium: { size: 15, wordCount: 10, cellSize: '28px', mobileSize: '20px' },
    hard: { size: 20, wordCount: 15, cellSize: '24px', mobileSize: '16px' }
};

const GRID_ELEMENT = document.getElementById('word-search-grid');
const WORD_LIST_ELEMENT = document.getElementById('word-list');
const MESSAGE_ELEMENT = document.getElementById('message');
const RESTART_BUTTON = document.getElementById('restart-button');
const DIFFICULTY_BUTTONS = document.querySelectorAll('.difficulty-selector button');

let gameData = null;
let currentDifficulty = DIFFICULTIES.medium; // Padrão: Médio
let currentGridSize = currentDifficulty.size;
let grid = [];
let wordsToFind = [];
let foundWords = new Set();
let isSelecting = false;
let startCell = null;
let endCell = null;
let selectedCells = [];

// --- Funções de Utilitário ---

/**
 * Embaralha um array (Fisher-Yates).
 * @param {Array} array - O array a ser embaralhado.
 * @returns {Array} O array embaralhado.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Seleciona palavras aleatoriamente do pool de palavras.
 * @param {Array<string>} pool - O pool de palavras disponíveis.
 * @param {number} count - O número de palavras a selecionar.
 * @returns {Array<string>} As palavras selecionadas.
 */
function selectRandomWords(pool, count) {
    const shuffled = shuffleArray([...pool]);
    return shuffled.slice(0, count);
}

// --- Funções de Geração do Grid ---

function createEmptyGrid(size) {
    const newGrid = [];
    for (let i = 0; i < size; i++) {
        newGrid[i] = new Array(size).fill('');
    }
    return newGrid;
}

// ... (findPlacement, placeWord, fillEmptyCells - Mantidas do algoritmo anterior) ...

/**
 * Tenta encontrar um local válido para colocar uma palavra no grid.
 * @param {Array<Array<string>>} currentGrid - O grid atual.
 * @param {string} word - A palavra a ser colocada.
 * @returns {{start: {r: number, c: number}, direction: {dr: number, dc: number}} | null}
 *          Retorna o ponto inicial e a direção se for possível, ou null.
 */
function findPlacement(currentGrid, word) {
    const size = currentGrid.length;
    const directions = [
        { dr: 0, dc: 1 },   // Horizontal (direita)
        { dr: 1, dc: 0 },   // Vertical (baixo)
        { dr: 1, dc: 1 },   // Diagonal (baixo-direita)
        { dr: 1, dc: -1 },  // Diagonal (baixo-esquerda)
        { dr: 0, dc: -1 },  // Horizontal (esquerda)
        { dr: -1, dc: 0 },  // Vertical (cima)
        { dr: -1, dc: -1 }, // Diagonal (cima-esquerda)
        { dr: -1, dc: 1 }   // Diagonal (cima-direita)
    ];

    const allPossibleStarts = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            allPossibleStarts.push({ r, c });
        }
    }
    shuffleArray(allPossibleStarts);
    shuffleArray(directions);

    for (const start of allPossibleStarts) {
        for (const direction of directions) {
            let canPlace = true;
            for (let k = 0; k < word.length; k++) {
                const r = start.r + k * direction.dr;
                const c = start.c + k * direction.dc;

                if (r < 0 || r >= size || c < 0 || c >= size) {
                    canPlace = false;
                    break;
                }

                const currentCell = currentGrid[r][c];
                if (currentCell !== '' && currentCell !== word[k]) {
                    canPlace = false;
                    break;
                }
            }

            if (canPlace) {
                return { start, direction };
            }
        }
    }

    return null;
}

function placeWord(currentGrid, word, start, direction) {
    for (let k = 0; k < word.length; k++) {
        const r = start.r + k * direction.dr;
        const c = start.c + k * direction.dc;
        currentGrid[r][c] = word[k];
    }
}

function fillEmptyCells(currentGrid) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const size = currentGrid.length;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (currentGrid[r][c] === '') {
                currentGrid[r][c] = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            }
        }
    }
}

function generateWordSearch(words) {
    let newGrid = createEmptyGrid(currentGridSize);

    const sortedWords = words.map(w => w.toUpperCase()).sort((a, b) => b.length - a.length);

    sortedWords.forEach(word => {
        const placement = findPlacement(newGrid, word);
        if (placement) {
            placeWord(newGrid, word, placement.start, placement.direction);
        } else {
            console.warn(`Não foi possível colocar a palavra: ${word}`);
        }
    });

    fillEmptyCells(newGrid);

    return newGrid;
}

// --- Funções de Renderização e Interação (Ajustadas) ---

function renderGrid() {
    GRID_ELEMENT.innerHTML = '';
    
    // Ajusta as variáveis CSS para o tamanho do grid
    GRID_ELEMENT.style.setProperty('--grid-cols', currentGridSize);
    GRID_ELEMENT.style.setProperty('--cell-size', currentDifficulty.cellSize);
    
    // Ajusta o tamanho da célula para mobile (se necessário)
    GRID_ELEMENT.style.setProperty('--cell-size-mobile', currentDifficulty.mobileSize);

    grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('grid-cell');
            cellDiv.textContent = cell;
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;
            cellDiv.addEventListener('mousedown', handleMouseDown);
            cellDiv.addEventListener('mouseover', handleMouseOver);
            cellDiv.addEventListener('mouseup', handleMouseUp);
            GRID_ELEMENT.appendChild(cellDiv);
        });
    });
}

function renderWordList() {
    WORD_LIST_ELEMENT.innerHTML = '';
    wordsToFind.forEach(word => {
        const listItem = document.createElement('li');
        listItem.textContent = word;
        listItem.dataset.word = word.toUpperCase();
        if (foundWords.has(word.toUpperCase())) {
            listItem.classList.add('found');
        }
        WORD_LIST_ELEMENT.appendChild(listItem);
    });
}

function markCellsAsFound(cells) {
    cells.forEach(cell => {
        const cellElement = GRID_ELEMENT.querySelector(`[data-row="${cell.r}"][data-col="${cell.c}"]`);
        if (cellElement) {
            cellElement.classList.add('found');
        }
    });
}

// ... (getCellsBetween, updateSelectionVisual, checkSelection, handleMouseDown, handleMouseOver, handleMouseUp - Mantidas) ...

function getCellsBetween(start, end) {
    const cells = [];
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);

    if (dr !== 0 && dc !== 0 && Math.abs(end.r - start.r) !== Math.abs(end.c - start.c)) {
        return [];
    }
    if (dr === 0 && dc === 0) {
        return [{ r: start.r, c: start.c }];
    }

    let r = start.r;
    let c = start.c;

    while (true) {
        cells.push({ r, c });
        if (r === end.r && c === end.c) break;
        r += dr;
        c += dc;
    }

    return cells;
}

function updateSelectionVisual(cells) {
    GRID_ELEMENT.querySelectorAll('.grid-cell.selected').forEach(cellElement => {
        cellElement.classList.remove('selected');
    });

    selectedCells = cells;

    selectedCells.forEach(cell => {
        const cellElement = GRID_ELEMENT.querySelector(`[data-row="${cell.r}"][data-col="${cell.c}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
        }
    });
}

function checkSelection(cells) {
    if (cells.length === 0) return;

    const selectedWord = cells.map(cell => grid[cell.r][cell.c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    const wordFound = wordsToFind.find(word => {
        const upperWord = word.toUpperCase();
        return upperWord === selectedWord || upperWord === reversedWord;
    });

    if (wordFound && !foundWords.has(wordFound.toUpperCase())) {
        foundWords.add(wordFound.toUpperCase());
        markCellsAsFound(cells);
        renderWordList();
        MESSAGE_ELEMENT.textContent = `Palavra encontrada: ${wordFound}!`;

        if (foundWords.size === wordsToFind.length) {
            MESSAGE_ELEMENT.textContent = 'Parabéns! Você encontrou todas as palavras!';
            RESTART_BUTTON.style.display = 'block';
        }
    } else if (wordFound && foundWords.has(wordFound.toUpperCase())) {
        MESSAGE_ELEMENT.textContent = `Você já encontrou a palavra ${wordFound}!`;
    } else {
        MESSAGE_ELEMENT.textContent = 'Tente novamente!';
    }

    updateSelectionVisual([]);
}

function handleMouseDown(event) {
    if (event.button !== 0) return;
    const cell = event.target;
    startCell = {
        r: parseInt(cell.dataset.row),
        c: parseInt(cell.dataset.col)
    };
    isSelecting = true;
    MESSAGE_ELEMENT.textContent = '';
    updateSelectionVisual([startCell]);
}

function handleMouseOver(event) {
    if (!isSelecting) return;
    const cell = event.target;
    const currentCell = {
        r: parseInt(cell.dataset.row),
        c: parseInt(cell.dataset.col)
    };

    if (startCell) {
        const cells = getCellsBetween(startCell, currentCell);
        updateSelectionVisual(cells);
    }
}

function handleMouseUp(event) {
    if (!isSelecting) return;
    isSelecting = false;

    const cell = event.target;
    endCell = {
        r: parseInt(cell.dataset.row),
        c: parseInt(cell.dataset.col)
    };

    if (startCell && endCell) {
        const cells = getCellsBetween(startCell, endCell);
        checkSelection(cells);
    }

    startCell = null;
    endCell = null;
}

// --- Lógica de Nível de Dificuldade ---

function setActiveDifficultyButton(difficulty) {
    DIFFICULTY_BUTTONS.forEach(button => {
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
        if (button.dataset.difficulty === difficulty) {
            button.classList.add('btn-primary');
            button.classList.remove('btn-secondary');
        }
    });
}

function startGame(difficultyKey) {
    currentDifficulty = DIFFICULTIES[difficultyKey];
    currentGridSize = currentDifficulty.size;
    
    // 1. Seleciona as palavras
    wordsToFind = selectRandomWords(gameData.words, currentDifficulty.wordCount);

    // 2. Limpa o estado e define o botão ativo
    foundWords.clear();
    isSelecting = false;
    startCell = null;
    endCell = null;
    selectedCells = [];
    RESTART_BUTTON.style.display = 'none';
    MESSAGE_ELEMENT.textContent = 'Clique e arraste para selecionar uma palavra!';
    setActiveDifficultyButton(difficultyKey);

    // 3. Gera e renderiza o novo grid
    grid = generateWordSearch(wordsToFind);
    renderGrid();
    renderWordList();
}

// --- Inicialização do Jogo ---

async function initGame() {
    try {
        // Carrega o arquivo JSON
        const response = await fetch('../../data/caca-palavras-data.json');
        gameData = await response.json();
        
        // Adiciona listeners aos botões de dificuldade
        DIFFICULTY_BUTTONS.forEach(button => {
            button.addEventListener('click', (e) => {
                startGame(e.target.dataset.difficulty);
            });
        });

        RESTART_BUTTON.addEventListener('click', () => startGame(Object.keys(DIFFICULTIES).find(key => DIFFICULTIES[key] === currentDifficulty)));

        // Inicia o jogo no nível médio por padrão
        startGame('medium');

    } catch (error) {
        console.error('Erro ao carregar ou inicializar o jogo:', error);
        MESSAGE_ELEMENT.textContent = 'Erro ao carregar o jogo. Verifique o arquivo de dados.';
    }
}

document.addEventListener('DOMContentLoaded', initGame);
