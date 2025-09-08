document.addEventListener('DOMContentLoaded', () => {
    const destaqueContainer = document.getElementById('noticias-destaque');
    const recentesContainer = document.getElementById('noticias-recentes');

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
                    <p>${noticia.conteudo.substring(0, 100)}...</p>
                    <a href="#" class="btn btn-primary">Leia Mais</a>
                </div>
            </div>
        `).join('');
    }

    function exibirRecentes(noticias) {
        recentesContainer.innerHTML = noticias.map(noticia => `
            <div class="card card-noticia">
                <div class="noticia-imagem">
                    <img src="${noticia.foto_principal}" alt="${noticia.titulo}">
                </div>
                <div class="noticia-conteudo">
                    <span class="noticia-data">${new Date(noticia.data).toLocaleDateString('pt-BR')}</span>
                    <h4 class="noticia-titulo">${noticia.titulo}</h4>
                    <p class="noticia-subtitulo">${noticia.subtitulo}</p>
                    <p>${noticia.conteudo}</p>
                    ${noticia.foto_secundaria ? `<img src="${noticia.foto_secundaria}" class="foto-secundaria">` : ''}
                </div>
            </div>
        `).join('');
    }

    carregarNoticias();
    initMobileMenu();
});
