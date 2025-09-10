document.addEventListener('DOMContentLoaded', () => {
    const destaqueContainer = document.getElementById('noticias-destaque');
    const recentesContainer = document.getElementById('noticias-recentes');
    const modal = document.getElementById('modal-noticia');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('modal-close-btn');

    let todasAsNoticias = [];

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

            todasAsNoticias = dados.noticias;

            // Ordena as notícias da mais recente para a mais antiga
            const noticiasOrdenadas = dados.noticias.sort((a, b) => new Date(b.data) - new Date(a.data));

            const noticiasDestaque = noticiasOrdenadas.filter(n => dados.destaques.includes(n.id));
            const noticiasNormais = noticiasOrdenadas.filter(n => !dados.destaques.includes(n.id));

            exibirDestaques(noticiasDestaque);
            exibirRecentes(noticiasNormais);

        } catch (error) {
            console.error('Erro ao carregar notícias:', error);
            recentesContainer.innerHTML = '<p class="alert alert-error">Não foi possível carregar as notícias. Tente novamente mais tarde.</p>';
        }
    }

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
        recentesContainer.innerHTML = noticias.map(noticia => `
            <div class="card card-noticia">
                <div class="noticia-imagem">
                    <img src="${noticia.foto_principal}" alt="${noticia.titulo}" class="card-img-list">
                </div>
                <div class="noticia-conteudo">
                    <span class="noticia-data">${new Date(noticia.data).toLocaleDateString('pt-BR')}</span>
                    <h4 class="noticia-titulo">${noticia.titulo}</h4>
                    <p class="noticia-subtitulo">${noticia.subtitulo}</p>
                    <p>${noticia.conteudo}</p>
                </div>
            </div>
        `).join('');
    }

    function abrirModalComNoticia(id) {
        const noticia = todasAsNoticias.find(n => n.id === id);
        if (!noticia) return;

        modalBody.innerHTML = `
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
    }

    function fecharModal() {
        modal.classList.remove('active');
        modalBody.innerHTML = ''; // Limpa o conteúdo ao fechar
    }

    closeModalBtn.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        // Fecha o modal se o clique for no fundo escuro (no próprio elemento .modal)
        if (e.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });

    carregarNoticias();
    initMobileMenu();
});
