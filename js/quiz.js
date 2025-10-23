document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const startScreen = document.getElementById('quiz-start-screen');
    const gameScreen = document.getElementById('quiz-game-screen');
    const endScreen = document.getElementById('quiz-end-screen');

    const startBtn = document.getElementById('start-quiz-btn');
    const nextBtn = document.getElementById('next-question-btn');
    
    const quizTitleEl = document.querySelector('#quiz-start-screen .quiz-title');
    const quizDescriptionEl = document.querySelector('#quiz-start-screen .quiz-description');
    
    const questionTextEl = document.getElementById('question-text');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackContainerEl = document.getElementById('feedback-container');
    const feedbackTextEl = document.getElementById('feedback-text');
    const curiosityTextEl = document.getElementById('curiosity-text');
    const scoreTextEl = document.getElementById('score-text');

    // Variáveis do jogo
    let allQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // Função principal para iniciar o quiz
    async function initializeQuiz() {
        const quizType = Math.floor(Math.random() * 3); // 0, 1, ou 2
        let quizData;

        try {
            if (quizType === 0) { // Quiz da Paróquia
                quizData = await loadQuizData('../../data/quiz_paroquia.json');
                allQuestions = shuffleArray(quizData.perguntas);
            } else if (quizType === 1) { // Quiz do Santo do Dia (ou aleatório se não achar)
                quizData = await loadQuizData('../../data/quiz_santos.json');
                const today = new Date();
                const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const santoDoDia = quizData.santos.find(s => s.data === formattedDate);
                
                if (santoDoDia) {
                    allQuestions = [santoDoDia];
                } else {
                    // Se não houver santo para o dia, pega um aleatório
                    allQuestions = [quizData.santos[Math.floor(Math.random() * quizData.santos.length)]];
                }
            } else { // Quiz Diário (conhecimentos gerais)
                quizData = await loadQuizData('../../data/quiz_diario.json');
                allQuestions = shuffleArray(quizData.perguntas);
            }

            // Atualiza a tela inicial com o título do quiz carregado
            quizTitleEl.textContent = quizData.titulo;
            quizDescriptionEl.textContent = "Teste seus conhecimentos e aprenda mais sobre nossa fé!";
            
        } catch (error) {
            quizTitleEl.textContent = "Erro!";
            quizDescriptionEl.textContent = "Não foi possível carregar o quiz. Tente novamente mais tarde.";
            startBtn.disabled = true;
            console.error("Erro ao carregar dados do quiz:", error);
        }
    }

    // Carrega o arquivo JSON
    async function loadQuizData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    // Embaralha as perguntas
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Inicia o jogo
    startBtn.addEventListener('click', () => {
        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        currentQuestionIndex = 0;
        score = 0;
        showQuestion();
    });

    // Mostra a pergunta atual
    function showQuestion() {
        resetState();
        const question = allQuestions[currentQuestionIndex];
        questionTextEl.textContent = question.pergunta;

        shuffleArray(question.opcoes).forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectAnswer(button, option, question.respostaCorreta, question.curiosidade));
            optionsContainerEl.appendChild(button);
        });
    }

    // Reseta o estado entre as perguntas
    function resetState() {
        optionsContainerEl.innerHTML = '';
        feedbackContainerEl.style.display = 'none';
        nextBtn.style.display = 'none';
    }

    // Processa a resposta selecionada
    function selectAnswer(button, selectedOption, correctAnswer, curiosity) {
        // Desabilita todos os botões
        Array.from(optionsContainerEl.children).forEach(btn => {
            btn.disabled = true;
            // Mostra a resposta correta
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        // Verifica se a resposta está correta
        if (selectedOption === correctAnswer) {
            score++;
            button.classList.add('correct');
            feedbackTextEl.textContent = "Resposta Correta!";
        } else {
            button.classList.add('wrong');
            feedbackTextEl.textContent = "Resposta Incorreta!";
        }

        curiosityTextEl.textContent = `Curiosidade: ${curiosity}`;
        feedbackContainerEl.style.display = 'block';
        
        // Mostra o botão de próxima pergunta ou de finalizar
        if (allQuestions.length > currentQuestionIndex + 1) {
            nextBtn.style.display = 'inline-block';
        } else {
            nextBtn.textContent = 'Finalizar Quiz';
            nextBtn.style.display = 'inline-block';
        }
    }

    // Evento do botão "Próxima Pergunta"
    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < allQuestions.length) {
            showQuestion();
        } else {
            showEndScreen();
        }
    });

    // Mostra a tela final
    function showEndScreen() {
        gameScreen.style.display = 'none';
        endScreen.style.display = 'block';
        scoreTextEl.textContent = `Você acertou ${score} de ${allQuestions.length} perguntas!`;
    }

    // Inicia tudo
    initializeQuiz();
});
