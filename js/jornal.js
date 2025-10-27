document.addEventListener('DOMContentLoaded', () => {
    const destaqueContainer = document.getElementById('noticias-destaque');
    const recentesContainer = document.getElementById('noticias-recentes');
    const modal = document.getElementById('modal-noticia');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroData = document.getElementById('filtro-data');
    const filtroBusca = document.getElementById('filtro-busca');
    const limparFiltrosBtn = document.getElementById('limpar-filtros-btn');

    let todasAsNoticias = [];
    let noticiasFiltradas = [];
    let paginaAtual = 1;
    const itensPorPagina = 5;

    const mapaCategorias = {
        avisos: ['aviso', 'avisos'],
        eventos: ['festa', 'campanha', 'celebração', 'sucesso'],
        catequese: ['catequese', 'inscrições', 'crisma', 'inscrição']
    };

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

    async function carregarNoticias() {
        try {
            const response = await fetch('../data/jornal.json');
            const dados = await response.json();

            todasAsNoticias = dados.noticias.sort((a, b) => new Date(b.data) - new Date(a.data));

            popularFiltros(todasAsNoticias);

            aplicarFiltros();

        } catch (error) {
            console.error('Erro ao carregar notícias:', error);
            recentesContainer.innerHTML = '<p class="alert alert-error">Não foi possível carregar as notícias. Tente novamente mais tarde.</p>';
        }
    }

    function popularFiltros(noticias) {
        // Popula filtro de categorias
        const categorias = [...new Set(noticias.map(n => n.categoria))].filter(Boolean);
        filtroCategoria.innerHTML += categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        // Popula filtro de datas (Mês/Ano)
        const datas = [...new Set(noticias.map(n => {
            const d = new Date(n.data + "T00:00:00");
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }))];
        
        filtroData.innerHTML += datas.map(data => {
            const [ano, mes] = data.split('-');
            const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' });
            return `<option value="${data}">${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}</option>`;
        }).join('');
    }

    function aplicarFiltros() {
        const categoriaSelecionada = filtroCategoria.value;
        const data = filtroData.value;
        const busca = filtroBusca.value.toLowerCase();

        noticiasFiltradas = todasAsNoticias.filter(noticia => {
            let matchCategoria = true;

            if (categoriaSelecionada !== 'todas') {
                const palavrasChave = mapaCategorias[categoriaSelecionada];
                const textoCompleto = (noticia.titulo + ' ' + noticia.conteudo).toLowerCase();
                // A notícia precisa conter pelo menos UMA das palavras-chave da categoria
                matchCategoria = palavrasChave.some(palavra => textoCompleto.includes(palavra));
            }
            
            const d = new Date(noticia.data + "T00:00:00");
            const dataNoticia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const matchData = data === 'todas' || dataNoticia === data;

            const matchBusca = busca === '' || 
                               noticia.titulo.toLowerCase().includes(busca) || 
                               noticia.conteudo.toLowerCase().includes(busca);

            return matchCategoria && matchData && matchBusca;
        });

        const noticiasDestaque = noticiasFiltradas.filter(n => n.destaque); // Assumindo que o JSON pode ter "destaque: true"
        const noticiasNormais = noticiasFiltradas.filter(n => !n.destaque);

        paginaAtual = 1; 
        exibirDestaques(noticiasDestaque);
        exibirRecentes(noticiasNormais);
    }

    filtroCategoria.addEventListener('change', aplicarFiltros);
    filtroData.addEventListener('change', aplicarFiltros);
    filtroBusca.addEventListener('input', aplicarFiltros); // 'input' para filtrar enquanto digita
    limparFiltrosBtn.addEventListener('click', () => {
        filtroCategoria.value = 'todas';
        filtroData.value = 'todas';
        filtroBusca.value = '';
        aplicarFiltros();
    });

    function exibirDestaques(noticias) {
        if (noticias.length === 0) {
            destaqueContainer.style.display = 'none';
            return;
        }
        destaqueContainer.innerHTML = noticias.map(noticia => `
            <div class="card card-destaque">
                <img src="${noticia.foto_principal}" alt="${noticia.titulo}" class="card-img-top">
                <div class="card-body">
                    <span class="badge badge-primary">Destaque</span>
                    <h3 class="card-title">${noticia.titulo}</h3>
                    <p class="card-subtitle">${noticia.subtitulo}</p>
                    <p class="card-conteudo">${noticia.conteudo.substring(0, 100)}...</p>
                    <a href="#" class="btn btn-primary leia-mais-btn" data-id="${noticia.id}">Leia Mais</a>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.leia-mais-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); // Impede que o link '#' recarregue a página
                const noticiaId = e.target.getAttribute('data-id');
                abrirModalComNoticia(noticiaId);
            });
        });
    }

    function exibirRecentes(noticias) {
        recentesContainer.innerHTML = ''; // Limpa o container

        if (noticias.length === 0) {
            recentesContainer.innerHTML = '<p class="alert alert-info">Nenhuma notícia encontrada com os filtros selecionados.</p>';
            document.getElementById('paginacao-container')?.remove();
            return;
        }

        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const itensDaPagina = noticias.slice(inicio, fim);

        itensDaPagina.forEach((noticia, index) => {
            const cardHTML = `
                <div class="card card-noticia" data-id="${noticia.id}">
                    <div class="noticia-imagem">
                        <img src="${noticia.foto_principal}" alt="${noticia.titulo}" class="card-img-list">
                    </div>
                    <div class="noticia-conteudo">
                        <span class="noticia-data">${new Date(noticia.data + "T00:00:00").toLocaleDateString('pt-BR')}</span>
                        <h4 class="noticia-titulo">${noticia.titulo}</h4>
                        <p class="noticia-subtitulo">${noticia.conteudo.substring(0, 120)}...</p>
                        <span class="leia-mais-link">Ver notícia completa &rarr;</span>
                    </div>
                </div>
            `;
            // Adiciona o HTML do card ao container
            recentesContainer.insertAdjacentHTML('beforeend', cardHTML);

            // Encontra o card que acabamos de adicionar
            const cardElement = recentesContainer.lastElementChild;
            
            // Aplica a classe de animação com um pequeno atraso em cascata
            cardElement.style.animationDelay = `${index * 100}ms`; // Atraso de 100ms por card
            cardElement.classList.add('card-fade-in');

            // Adiciona o evento de clique
            cardElement.addEventListener('click', () => {
                abrirModalComNoticia(cardElement.dataset.id);
            });
        });

        renderizarControlesPaginacao(noticias.length);
    }

    function renderizarControlesPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);
        let paginacaoContainer = document.getElementById('paginacao-container');
        
        if (!paginacaoContainer) {
            paginacaoContainer = document.createElement('div');
            paginacaoContainer.id = 'paginacao-container';
            paginacaoContainer.className = 'pagination';
            recentesContainer.insertAdjacentElement('afterend', paginacaoContainer);
        }

        paginacaoContainer.innerHTML = '';

        if (totalPaginas <= 1) return;

        for (let i = 1; i <= totalPaginas; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.className = 'pagination-link';
            if (i === paginaAtual) {
                pageLink.classList.add('active');
            }
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                paginaAtual = i;
                exibirRecentesPaginado(noticiasFiltradas.filter(n => !n.destaque));
            });
            paginacaoContainer.appendChild(pageLink);
        }
    }

    function abrirModalComNoticia(id) {
        const noticiaIndex = noticiasFiltradas.findIndex(n => n.id === id);
        if (noticiaIndex === -1) return;

        const noticia = noticiasFiltradas[noticiaIndex];

        // Verifica se há notícia anterior ou próxima
        const temAnterior = noticiaIndex > 0;
        const temProxima = noticiaIndex < noticiasFiltradas.length - 1;

        modalBody.innerHTML = `
            <div class="modal-header-unified">
                <h3 class="modal-title-header">Notícia</h3>
                <div class="modal-controls">
                    <button id="nav-anterior" class="btn-modal-nav" title="Notícia Anterior" ${!temAnterior ? 'disabled' : ''}>
                        <
                    </button>
                    <button id="nav-proxima" class="btn-modal-nav" title="Próxima Notícia" ${!temProxima ? 'disabled' : ''}>
                        >
                    </button>
                    <button class="btn-modal-nav btn-modal-close" id="modal-close-btn" title="Fechar">
                        x
                    </button>
                </div>
            </div>

            <h2 class="section-title text-left mb-2">${noticia.titulo}</h2>
            <p class="section-subtitle text-left mb-3">${noticia.subtitulo}</p>
            <p class="mb-3"><em>Publicado em: ${new Date(noticia.data).toLocaleDateString('pt-BR')}</em></p>
            <img src="${noticia.foto_secundaria}" alt="${noticia.titulo}" style="width:100%; border-radius: 8px; margin-bottom: 1rem;">
            <div class="card-body">
                <p>${noticia.conteudo.replace(/\n/g, '')}</p>
                ${noticia.conteudo_adicional ? `
                    <div class="conteudo-adicional mt-4">
                        ${noticia.conteudo_adicional}
                    </div>
                ` : ''}
            </div>
        `;
        modal.classList.add('active');

        document.getElementById('modal-close-btn').addEventListener('click', fecharModal);

        if (temAnterior) {
            document.getElementById('nav-anterior').addEventListener('click', () => {
                abrirModalComNoticia(noticiasFiltradas[noticiaIndex - 1].id);
            });
        }
        if (temProxima) {
            document.getElementById('nav-proxima').addEventListener('click', () => {
                abrirModalComNoticia(noticiasFiltradas[noticiaIndex + 1].id);
            });
        }
    }

    function fecharModal() {
        modal.classList.remove('active');
        modalBody.innerHTML = ''; // Limpa o conteúdo ao fechar
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });

    carregarNoticias();
    initMobileMenu();
});
