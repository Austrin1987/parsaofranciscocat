document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const levelSelectionScreen = document.getElementById('level-selection');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const levelButtonsContainer = document.getElementById('level-buttons');
    const memoryGrid = document.getElementById('memory-grid');
    const timerEl = document.getElementById('timer');
    const movesEl = document.getElementById('moves');
    const finalStatsEl = document.getElementById('final-stats');
    const playAgainBtn = document.getElementById('play-again-btn');
    const shareBtn = document.getElementById('share-btn');

    // Variáveis do Jogo
    let gameData;
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timerInterval;
    let seconds = 0;
    let isLocked = false; // Bloqueia o clique enquanto verifica os pares

    // Carrega os dados e inicializa
    async function init() {
        try {
            const response = await fetch('../../data/memoria.json');
            gameData = await response.json();
            createLevelButtons();
        } catch (error) {
            console.error("Erro ao carregar dados do jogo da memória:", error);
            levelSelectionScreen.innerHTML = '<h2 class="section-title">Erro ao carregar o jogo. Tente novamente.</h2>';
        }
    }

    function createLevelButtons() {
        gameData.niveis.forEach(level => {
            const button = document.createElement('button');
            button.textContent = level.nome;
            button.classList.add('btn', 'btn-primary');
            button.addEventListener('click', () => startGame(level));
            levelButtonsContainer.appendChild(button);
        });
    }

    function startGame(level) {
        levelSelectionScreen.style.display = 'none';
        endScreen.style.display = 'none';
        gameScreen.style.display = 'block';

        // Reseta o estado do jogo
        resetGame();
        
        // Prepara as cartas
        const availableCards = [...gameData.cartas];
        shuffleArray(availableCards);
        const gameCards = availableCards.slice(0, level.pares);
        cards = shuffleArray([...gameCards, ...gameCards]); // Duplica para formar os pares e embaralha

        // Cria o grid e as cartas
        const [cols, rows] = level.grid.split('x');
        memoryGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        cards.forEach(cardInfo => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card-memoria');
            cardElement.dataset.id = cardInfo.id;
            cardElement.innerHTML = `
                <div class="card-face card-front"></div>
                <div class="card-face card-back">
                    <img src="${cardInfo.imagem}" alt="${cardInfo.nome}">
                </div>
            `;
            cardElement.addEventListener('click', () => flipCard(cardElement));
            memoryGrid.appendChild(cardElement);
        });

        startTimer();
    }

    function flipCard(cardElement) {
        if (isLocked || cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) {
            return;
        }

        cardElement.classList.add('flipped');
        flippedCards.push(cardElement);

        if (flippedCards.length === 2) {
            incrementMoves();
            isLocked = true; // Bloqueia novos cliques
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.id === card2.dataset.id;

        if (isMatch) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            resetFlippedCards();
            if (matchedPairs === cards.length / 2) {
                endGame();
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                resetFlippedCards();
            }, 1200); // Tempo para o usuário ver a segunda carta
        }
    }

    function resetFlippedCards() {
        flippedCards = [];
        isLocked = false;
    }

    function resetGame() {
        clearInterval(timerInterval);
        seconds = 0;
        moves = 0;
        matchedPairs = 0;
        timerEl.textContent = "Tempo: 00:00";
        movesEl.textContent = "Movimentos: 0";
        memoryGrid.innerHTML = '';
        flippedCards = [];
        isLocked = false;
    }

    function incrementMoves() {
        moves++;
        movesEl.textContent = `Movimentos: ${moves}`;
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            timerEl.textContent = `Tempo: ${mins}:${secs}`;
        }, 1000);
    }

    function endGame() {
        clearInterval(timerInterval);
        gameScreen.style.display = 'none';
        endScreen.style.display = 'block';
        finalStatsEl.textContent = `Você completou o jogo em ${timerEl.textContent.replace('Tempo: ', '')} com ${moves} movimentos!`;
    }

    playAgainBtn.addEventListener('click', () => {
        endScreen.style.display = 'none';
        levelSelectionScreen.style.display = 'block';
    });

    shareBtn.addEventListener('click', () => {
        const textToShare = `Joguei o Jogo da Memória da Paróquia São Francisco e terminei em ${timerEl.textContent.replace('Tempo: ', '')} com ${moves} movimentos! Tente bater meu recorde!`;
        const shareData = {
            title: 'Resultado - Jogo da Memória',
            text: textToShare,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                // Fallback para desktop: copiar para a área de transferência
                navigator.clipboard.writeText(textToShare + `\nJogue também: ${window.location.href}`);
                alert('Resultado copiado para a área de transferência!');
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            alert('Não foi possível compartilhar o resultado.');
        }
    });

    // Função utilitária para embaralhar
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav');
        
        if (mobileMenuBtn && nav) {
            mobileMenuBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                nav.classList.toggle('active');
            });
            
            // Fecha ao clicar fora
            document.addEventListener('click', function(e) {
                if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    closeMobileMenu();
                }
            });
            
            // Fecha ao redimensionar
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    closeMobileMenu();
                }
            });
        }
    }

    function closeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav');
        
        if (mobileMenuBtn && nav) {
            mobileMenuBtn.classList.remove('active');
            nav.classList.remove('active');
        }
    }

    init();
    initMobileMenu();
});
