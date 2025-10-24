document.addEventListener('DOMContentLoaded', () => {
    // Telas
    const selectionScreen = document.getElementById('selection-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');

    // Botões de Seleção
    const themeButtons = document.querySelectorAll('#theme-buttons .btn-selection');
    const subThemeGroup = document.getElementById('sub-theme-group');
    const subThemeButtonsContainer = document.getElementById('sub-theme-buttons');
    const difficultyStepLabel = document.getElementById('difficulty-step-label');
    const difficultyButtons = document.querySelectorAll('#difficulty-buttons .btn-selection');
    const startBtn = document.getElementById('start-quiz-btn');

    // Elementos do Jogo
    const questionCounterEl = document.getElementById('question-counter');
    const questionTextEl = document.getElementById('question-text');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackContainerEl = document.getElementById('feedback-container');
    const curiosityTextEl = document.getElementById('curiosity-text');
    const nextBtn = document.getElementById('next-question-btn');

    // Elementos da Tela Final
    const scoreTextEl = document.getElementById('score-text');
    const restartBtn = document.getElementById('restart-btn');
    const shareBtn = document.getElementById('share-btn');

    // Estado do Jogo
    let selectedTheme = null;
    let selectedSubTheme = null;
    let selectedDifficulty = null;
    let allQuestions = [];
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // --- LÓGICA DA TELA DE SELEÇÃO ---

    function initQuiz() { // ADICIONADO: Função para organizar o início
        // MOVIDO: Adiciona os listeners dos botões aqui dentro
        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                resetSubsequentSelections();
                selectedTheme = button.dataset.theme;
                updateSelection(themeButtons, button);
                handleThemeSelection();
            });
        });

        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedDifficulty = parseInt(button.dataset.difficulty);
                updateSelection(difficultyButtons, button);
            });
        });

        startBtn.addEventListener('click', loadAndStartGame); // Renomeado para clareza
        nextBtn.addEventListener('click', handleNextQuestion); // Renomeado para clareza
        restartBtn.addEventListener('click', handleRestart); // Renomeado para clareza
        shareBtn.addEventListener('click', handleShare); // Renomeado para clareza
    }


    function resetSubsequentSelections() {
        selectedSubTheme = null;
        subThemeGroup.style.display = 'none';
        subThemeButtonsContainer.innerHTML = '';
        difficultyStepLabel.textContent = '2. Escolha a Dificuldade:';
        startBtn.disabled = true;
    }

    function updateSelection(buttonGroup, selectedButton) {
        const buttons = Array.from(buttonGroup);
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        selectedButton.classList.add('selected');
        checkIfReadyToStart();
    }

    async function handleThemeSelection() {
        subThemeButtonsContainer.innerHTML = '';
        if (selectedTheme === 'santos' || selectedTheme === 'diario') {
            difficultyStepLabel.textContent = '3. Escolha a Dificuldade:';
            const filePath = selectedTheme === 'santos' ? '../../data/quiz_santos.json' : '../../data/quiz_diario.json';
            const dataKey = selectedTheme === 'santos' ? 'santos' : 'temas';
            
            try {
                const response = await fetch(filePath);
                const data = await response.json();
                
                data[dataKey].forEach(item => {
                    const subThemeButton = document.createElement('button');
                    subThemeButton.className = 'btn-selection';
                    subThemeButton.dataset.subTheme = item.id;
                    subThemeButton.textContent = item.nome;
                    subThemeButton.addEventListener('click', () => {
                        selectedSubTheme = item.id;
                        updateSelection(subThemeButtonsContainer.childNodes, subThemeButton);
                    });
                    subThemeButtonsContainer.appendChild(subThemeButton);
                });
                
                subThemeGroup.style.display = 'block';

            } catch (error) {
                console.error("Erro ao carregar sub-temas:", error);
            }
        } else {
            // Se for 'paroquia', não há sub-tema
            checkIfReadyToStart();
        }
    }

    function checkIfReadyToStart() {
        const isReady = (selectedTheme === 'paroquia' && selectedDifficulty) || 
                        (selectedTheme !== 'paroquia' && selectedSubTheme && selectedDifficulty);
        startBtn.disabled = !isReady;
    }

    startBtn.addEventListener('click', async () => {
        selectionScreen.style.display = 'none';
        loadingScreen.style.display = 'block';

        const themeFileMap = {
            'paroquia': '../../data/quiz_paroquia.json',
            'santos': '../../data/quiz_santos.json',
            'diario': '../../data/quiz_diario.json'
        };

        try {
            const response = await fetch(themeFileMap[selectedTheme]);
            const data = await response.json();
            
            if (selectedTheme === 'paroquia') {
                allQuestions = data.perguntas;
            } else {
                const dataKey = selectedTheme === 'santos' ? 'santos' : 'temas';
                const selectedGroup = data[dataKey].find(item => item.id === selectedSubTheme);
                allQuestions = selectedGroup.perguntas;
            }

            if (allQuestions.length < selectedDifficulty) {
                throw new Error(`Não há perguntas suficientes (${allQuestions.length}) para a dificuldade selecionada. Por favor, escolha uma dificuldade menor.`);
            }

            shuffleArray(allQuestions);
            currentQuestions = allQuestions.slice(0, selectedDifficulty);
            
            setTimeout(startGame, 500); // Pequeno delay para a tela de loading ser visível

        } catch (error) {
            console.error("Erro ao carregar o quiz:", error);
            loadingScreen.innerHTML = `<h2 class="quiz-title">Erro!</h2><p>${error.message}</p>`;
        }
    });

    // --- LÓGICA DO JOGO ---

    function startGame() {
        loadingScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        currentQuestionIndex = 0;
        score = 0;
        showQuestion();
    }

    function showQuestion() {
        resetState();
        const question = currentQuestions[currentQuestionIndex];
        questionCounterEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
        questionTextEl.textContent = question.pergunta;

        const options = shuffleArray([...question.opcoes]);
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectAnswer(button, option, question.respostaCorreta, question.curiosidade || question.contexto));
            optionsContainerEl.appendChild(button);
        });
    }
    
    function resetState() {
        optionsContainerEl.innerHTML = '';
        feedbackContainerEl.style.display = 'none';
    }

    function selectAnswer(button, selectedOption, correctAnswer, curiosity) {
        Array.from(optionsContainerEl.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) btn.classList.add('correct');
        });

        if (selectedOption === correctAnswer) {
            score++;
            button.classList.add('correct');
        } else {
            button.classList.add('wrong');
        }

        curiosityTextEl.textContent = `Curiosidade: ${curiosity}`;
        feedbackContainerEl.style.display = 'block';
        
        if (currentQuestions.length > currentQuestionIndex + 1) {
            nextBtn.textContent = 'Próxima Pergunta';
        } else {
            nextBtn.textContent = 'Finalizar Quiz';
        }
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            showQuestion();
        } else {
            showEndScreen();
        }
    });

    // --- LÓGICA DA TELA FINAL ---

    function showEndScreen() {
        gameScreen.style.display = 'none';
        endScreen.style.display = 'block';
        scoreTextEl.textContent = `Você acertou ${score} de ${currentQuestions.length} perguntas! (${Math.round((score / currentQuestions.length) * 100)}%)`;
    }

    restartBtn.addEventListener('click', () => {
        // Reseta o estado para a seleção
        endScreen.style.display = 'none';
        selectionScreen.style.display = 'block';
        startBtn.disabled = true;
        selectedTheme = null;
        selectedDifficulty = null;
        themeButtons.forEach(btn => btn.classList.remove('selected'));
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
    });

    shareBtn.addEventListener('click', () => {
        const themeName = selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);
        let subjectName = '';
        if (selectedSubTheme) {
            const subThemeEl = document.querySelector(`[data-sub-theme="${selectedSubTheme}"]`);
            subjectName = ` sobre ${subThemeEl.textContent}`;
        }
        
        const textToShare = `Fiz ${score} de ${currentQuestions.length} pontos no quiz de ${themeName}${subjectName} da Paróquia São Francisco! Tente você também!`;
        const shareData = {
            title: 'Resultado do Quiz Paroquial',
            text: textToShare,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(textToShare + `\nJogue em: ${window.location.href}`);
                alert('Resultado copiado para a área de transferência!');
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
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

    initMobileMenu();
    initQuiz();
});
