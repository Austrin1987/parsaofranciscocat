// js/caca-palavras.js

const GRID_SIZE = 15; // Mantido em 15x15
const GRID_ELEMENT = document.getElementById('word-search-grid');
const WORD_LIST_ELEMENT = document.getElementById('word-list');
const MESSAGE_ELEMENT = document.getElementById('message');
const RESTART_BUTTON = document.getElementById('restart-button');

let gameData = null;
let grid = [];
let wordsToFind = [];
let foundWords = new Set();
let isSelecting = false;
let startCell = null;
let endCell = null;
let selectedCells = [];

// --- Funções de Geração do Grid e Palavras (NOVO ALGORITMO) ---

/**
 * Gera um grid vazio preenchido com um caractere especial para indicar vazio.
 * @param {number} size - O tamanho do grid (size x size).
 * @returns {Array<Array<string>>} O grid gerado.
 */
function createEmptyGrid(size) {
    const newGrid = [];
    for (let i = 0; i < size; i++) {
        newGrid[i] = new Array(size).fill(''); // Usar string vazia para indicar célula vazia
    }
    return newGrid;
}

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

    // Tenta posições e direções aleatórias para evitar vieses
    const allPossibleStarts = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            allPossibleStarts.push({ r, c });
        }
    }
    // Embaralha as posições iniciais e direções para maior aleatoriedade
    allPossibleStarts.sort(() => Math.random() - 0.5);
    directions.sort(() => Math.random() - 0.5);

    for (const start of allPossibleStarts) {
        for (const direction of directions) {
            let canPlace = true;
            for (let k = 0; k < word.length; k++) {
                const r = start.r + k * direction.dr;
                const c = start.c + k * direction.dc;

                // 1. Verifica se está dentro dos limites
                if (r < 0 || r >= size || c < 0 || c >= size) {
                    canPlace = false;
                    break;
                }

                // 2. Verifica se a célula está vazia ou tem a mesma letra (sobreposição)
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

    return null; // Não foi possível encontrar um local
}

/**
 * Coloca a palavra no grid no local e direção especificados.
 * @param {Array<Array<string>>} currentGrid - O grid atual.
 * @param {string} word - A palavra a ser colocada.
 * @param {{r: number, c: number}} start - Ponto inicial.
 * @param {{dr: number, dc: number}} direction - Direção.
 */
function placeWord(currentGrid, word, start, direction) {
    for (let k = 0; k < word.length; k++) {
        const r = start.r + k * direction.dr;
        const c = start.c + k * direction.dc;
        currentGrid[r][c] = word[k];
    }
}

/**
 * Preenche as células vazias do grid com letras aleatórias.
 * @param {Array<Array<string>>} currentGrid - O grid com as palavras colocadas.
 */
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

/**
 * Gera o grid final com todas as palavras garantidas.
 * @param {Array<string>} words - Lista de palavras a serem colocadas.
 * @returns {Array<Array<string>>} O grid final.
 */
function generateWordSearch(words) {
    let newGrid = createEmptyGrid(GRID_SIZE);

    // Tenta colocar as palavras, priorizando as mais longas para melhor sobreposição
    const sortedWords = words.map(w => w.toUpperCase()).sort((a, b) => b.length - a.length);

    sortedWords.forEach(word => {
        const placement = findPlacement(newGrid, word);
        if (placement) {
            placeWord(newGrid, word, placement.start, placement.direction);
        } else {
            // Isso não deve acontecer com um grid 15x15 e 10 palavras curtas,
            // mas é um fallback de segurança.
            console.warn(`Não foi possível colocar a palavra: ${word}`);
        }
    });

    // Preenche as células vazias
    fillEmptyCells(newGrid);

    return newGrid;
}

// --- Funções de Renderização ---

/**
 * Renderiza o grid no HTML.
 */
function renderGrid() {
    GRID_ELEMENT.innerHTML = '';
    GRID_ELEMENT.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

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

/**
 * Renderiza a lista de palavras a serem encontradas.
 */
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

/**
 * Marca as células como encontradas no HTML.
 * @param {Array<{r: number, c: number}>} cells - As células que formam a palavra.
 */
function markCellsAsFound(cells) {
    cells.forEach(cell => {
        const cellElement = GRID_ELEMENT.querySelector(`[data-row="${cell.r}"][data-col="${cell.c}"]`);
        if (cellElement) {
            // Apenas adiciona a classe 'found', não remove 'selected' imediatamente
            cellElement.classList.add('found');
        }
    });
}

// --- Funções de Interação do Usuário ---

/**
 * Obtém as células entre o ponto inicial e final.
 * @param {{r: number, c: number}} start - Célula inicial.
 * @param {{r: number, c: number}} end - Célula final.
 * @returns {Array<{r: number, c: number}>} Lista de células selecionadas.
 */
function getCellsBetween(start, end) {
    const cells = [];
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);

    // Verifica se é uma linha reta (horizontal, vertical ou diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(end.r - start.r) !== Math.abs(end.c - start.c)) {
        return []; // Não é uma linha reta válida
    }
    if (dr === 0 && dc === 0) {
        return [{ r: start.r, c: start.c }]; // Apenas uma célula
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

/**
 * Atualiza a seleção visual das células.
 * @param {Array<{r: number, c: number}>} cells - Células a serem marcadas como selecionadas.
 */
function updateSelectionVisual(cells) {
    // Limpa a seleção anterior, mas mantém a marcação 'found'
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

/**
 * Verifica se a seleção corresponde a uma palavra a ser encontrada.
 * @param {Array<{r: number, c: number}>} cells - Células selecionadas.
 */
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

    // Limpa a seleção visual após a verificação
    updateSelectionVisual([]);
}

// --- Handlers de Eventos de Mouse ---

function handleMouseDown(event) {
    if (event.button !== 0) return; // Apenas botão esquerdo
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

// --- Inicialização do Jogo ---

/**
 * Inicializa o jogo: carrega os dados, gera o grid e renderiza.
 */
async function initGame() {
    try {
        // Carrega o arquivo JSON
        const response = await fetch('../../data/caca-palavras-data.json');
        gameData = await response.json();
        wordsToFind = gameData.words;

        // Limpa o estado anterior
        foundWords.clear();
        isSelecting = false;
        startCell = null;
        endCell = null;
        selectedCells = [];
        RESTART_BUTTON.style.display = 'none';
        MESSAGE_ELEMENT.textContent = 'Clique e arraste para selecionar uma palavra!';

        // Gera e renderiza o novo grid
        grid = generateWordSearch(wordsToFind);
        renderGrid();
        renderWordList();

    } catch (error) {
        console.error('Erro ao carregar ou inicializar o jogo:', error);
        MESSAGE_ELEMENT.textContent = 'Erro ao carregar o jogo. Verifique o arquivo de dados.';
    }
}

RESTART_BUTTON.addEventListener('click', initGame);

// Inicia o jogo quando a página carrega
document.addEventListener('DOMContentLoaded', initGame);
