document.addEventListener('DOMContentLoaded', () => {
    const filtroPrincipal = document.getElementById('filtro-principal');
    const filtroPastorais = document.getElementById('filtro-pastorais');
    const conteudoDinamico = document.getElementById('conteudo-dinamico');
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
            popularFiltroPrincipal();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            conteudoDinamico.innerHTML = '<p class="alert alert-error">Não foi possível carregar as informações. Tente novamente mais tarde.</p>';
        }
    }

    // Popula o primeiro filtro com as capelas
    function popularFiltroPrincipal() {
        dados.capelas.forEach(capela => {
            const option = document.createElement('option');
            option.value = capela.id;
            option.textContent = capela.nome;
            filtroPrincipal.appendChild(option);
        });
    }

    // Lógica de seleção do filtro principal
    filtroPrincipal.addEventListener('change', () => {
        const selecao = filtroPrincipal.value;
        filtroPastorais.style.display = 'none';
        filtroPastorais.value = '';

        if (selecao === 'paroquia') {
            filtroPastorais.style.display = 'block';
            popularFiltroPastorais();
            limparConteudo();
        } else if (selecao) {
            const capela = dados.capelas.find(c => c.id === selecao);
            if (capela) exibirConteudo(capela, 'capela');
        } else {
            limparConteudo();
        }
    });

    // Popula o filtro de pastorais
    function popularFiltroPastorais() {
        filtroPastorais.innerHTML = '<option value="">Selecione uma pastoral...</option>';
        dados.pastorais.forEach(pastoral => {
            const option = document.createElement('option');
            option.value = pastoral.id;
            option.textContent = pastoral.nome;
            filtroPastorais.appendChild(option);
        });
    }

    // Lógica de seleção do filtro de pastorais
    filtroPastorais.addEventListener('change', () => {
        const selecao = filtroPastorais.value;
        if (selecao) {
            const pastoral = dados.pastorais.find(p => p.id === selecao);
            if (pastoral) exibirConteudo(pastoral, 'pastoral');
        } else {
            limparConteudo();
        }
    });

    // Exibe o conteúdo da capela ou pastoral
    function exibirConteudo(item, tipo) {
        let membrosHTML = '';

        const listaDePessoas = tipo === 'capela' ? item.coordenadores : item.membros;
        const tituloSecao = tipo === 'capela' ? 'Coordenação' : 'Membros';

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
    
    function limparConteudo() {
        conteudoDinamico.innerHTML = `
            <div class="placeholder-content">
                <h3>Bem-vindo!</h3>
                <p>Selecione uma capela ou pastoral nos filtros acima para ver os detalhes.</p>
            </div>`;
    }

    carregarDados();
    initMobileMenu();
});
