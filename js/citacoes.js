document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const loadingState = document.getElementById('loading-state');
    const gameState = document.getElementById('game-state');
    const quoteTextEl = document.getElementById('quote-text');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackContainerEl = document.getElementById('feedback-container');
    const contextTextEl = document.getElementById('context-text');

    // Função principal
    async function initGame() {
        try {
            const response = await fetch('../../data/citacoes.json');
            const data = await response.json();
            
            // Escolhe uma citação aleatória da lista
            const randomIndex = Math.floor(Math.random() * data.citacoes.length);
            const quoteData = data.citacoes[randomIndex];

            displayQuote(quoteData);

        } catch (error) {
            console.error("Erro ao carregar citações:", error);
            loadingState.innerHTML = '<h2 class="section-title">Erro ao carregar. Tente novamente.</h2>';
        }
    }

    function displayQuote(quoteData) {
        // Esconde o loading e mostra o jogo
        loadingState.style.display = 'none';
        gameState.style.display = 'block';

        // Preenche os elementos
        quoteTextEl.textContent = `"${quoteData.frase}"`;
        
        // Embaralha as opções para que a resposta correta não esteja sempre na mesma posição
        const shuffledOptions = shuffleArray(quoteData.opcoes);

        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => checkAnswer(button, option, quoteData.respostaCorreta, quoteData.contexto));
            optionsContainerEl.appendChild(button);
        });
    }

    function checkAnswer(selectedButton, selectedOption, correctAnswer, context) {
        // Desabilita todos os botões para impedir novos cliques
        const allButtons = optionsContainerEl.querySelectorAll('.option-btn');
        allButtons.forEach(btn => {
            btn.disabled = true;
            // Mostra qual era a resposta correta
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        // Marca a opção do usuário como errada, se for o caso
        if (selectedOption !== correctAnswer) {
            selectedButton.classList.add('wrong');
        }

        // Mostra o contexto/curiosidade
        contextTextEl.textContent = context;
        feedbackContainerEl.style.display = 'block';
    }

    // Função utilitária para embaralhar o array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Inicia o jogo
    initGame();
});
