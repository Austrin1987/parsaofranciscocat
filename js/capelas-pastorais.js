document.addEventListener('DOMContentLoaded', () => {
    const capelasContainer = document.getElementById('capelas-container');
    const pastoraisContainer = document.getElementById('pastorais-container');
    const cardsView = document.getElementById('cards-view');
    const conteudoDinamico = document.getElementById('conteudo-dinamico');
    const backButtonContainer = document.getElementById('back-button-container');
    const backButton = document.getElementById('back-button');
    let dados = {};

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

    // Carrega os dados do JSON
    async function carregarDados() {
        try {
            const response = await fetch('../data/capelas-pastorais.json');
            dados = await response.json();
            renderizarCards();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            conteudoDinamico.innerHTML = '<p class="alert alert-error">Não foi possível carregar as informações. Tente novamente mais tarde.</p>';
        }
    }

    // Renderiza os cards de capelas e pastorais
    function renderizarCards() {
        // Limpa os contêineres
        capelasContainer.innerHTML = '';
        pastoraisContainer.innerHTML = '';
        
        // Esconde a visão de detalhes e mostra a visão de cards
        conteudoDinamico.style.display = 'none';
        backButtonContainer.style.display = 'none';
        cardsView.style.display = 'block';

        // Adiciona cards de Capelas no contêiner de capelas
        dados.capelas.forEach(item => {
            const card = criarCard(item, 'capela');
            capelasContainer.appendChild(card);
        });

        // Adiciona cards de Pastorais no contêiner de pastorais
        dados.pastorais.forEach(item => {
            const card = criarCard(item, 'pastoral');
            pastoraisContainer.appendChild(card);
        });
    }


    // Cria um card individual
    function criarCard(item, tipo) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-item');
        cardDiv.dataset.id = item.id;
        cardDiv.dataset.tipo = tipo;

        const iconeHTML = `<i class="card-item-icon ${item.icone || 'fas fa-question-circle'}"></i>`;
        const descricao = item.descricao_curta || 'Clique para saber mais.';
        cardDiv.innerHTML = `
            ${iconeHTML}
            <h3 class="card-item-title">${item.nome}</h3>
            <p class="card-item-description">${descricao}</p>
        `;

        cardDiv.addEventListener('click', () => exibirConteudo(item, tipo));
        return cardDiv;
    }

    // Exibe o conteúdo da capela ou pastoral
    function exibirConteudo(item, tipo) {
        cardsView.style.display = 'none';
        conteudoDinamico.style.display = 'block';
        backButtonContainer.style.display = 'block';

        let membrosHTML = '';

        if (tipo === 'capela' && item.coordenadores) {
            membrosHTML = `
                <div class="membros-section">
                    <h3>Coordenação</h3>
                    <div class="membros-grid">
                        ${item.coordenadores.map(membro => `
                            <div class="card membro-card">
                                <img src="${membro.foto || '../images/membros/avatar_padrao.png'}" alt="Foto de ${membro.nome}" class="membro-foto" onerror="this.src='../images/membros/avatar_padrao.png';">
                                <div class="membro-info">
                                    <p><strong>${membro.nome}</strong></p>
                                    <span>${membro.funcao}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } else if (tipo === 'pastoral' && item.membros) {
             membrosHTML = `
                <div class="membros-section">
                    <h3>Membros</h3>
                    <div class="membros-grid">
                        ${item.membros.map(membro => `
                            <div class="card membro-card">
                                <img src="${membro.foto || '../images/membros/avatar_padrao.png'}" alt="Foto de ${membro.nome}" class="membro-foto" onerror="this.src='../images/membros/avatar_padrao.png';">
                                <div class="membro-info">
                                    <p><strong>${membro.nome}</strong></p>
                                    <span>${membro.funcao}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

        conteudoDinamico.innerHTML = `
            <div class="card">
                <h2>${item.nome}</h2>
                
                <div class="historia-section">
                    <h3>Nossa História</h3>
                    <div class="timeline">
                        ${item.historia.map(h => `
                            <div class="timeline-item">
                                <div class="timeline-point"></div>
                                <div class="timeline-content">
                                    <div class="timeline-year">${h.ano}</div>
                                    <p>${h.descricao}</p>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>

                <div class="horarios-section">
                    <h3>Horários</h3>
                    <div class="horarios-grid">
                        ${item.horarios.map(h => `
                            <div class="horario-card">
                                <div class="horario-dia">${h.titulo}</div>
                                <ul class="horario-lista">
                                    <li>${h.dia} - ${h.hora}</li>
                                </ul>
                            </div>`).join('')}
                    </div>
                </div>

                ${membrosHTML}
            </div>
        `;
    }
    
    backButton.addEventListener('click', () => {
        renderizarCards();
        conteudoDinamico.innerHTML = ''; // Limpa o conteúdo detalhado
    });

    carregarDados();
    initMobileMenu();
});
