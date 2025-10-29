document.addEventListener('DOMContentLoaded', () => {
    const destaqueContainer = document.getElementById('noticias-destaque');
    const recentesContainer = document.getElementById('noticias-recentes');
    const modal = document.getElementById('modal-noticia');
    const modalBody = document.getElementById('modal-body');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroData = document.getElementById('filtro-data');
    const filtroBusca = document.getElementById('filtro-busca');
    const limparFiltrosBtn = document.getElementById('limpar-filtros-btn');
    const imprimirBtn = document.getElementById('imprimir-btn');
    const modalImpressao = document.getElementById('modal-impressao');
    const closeModalImpressaoBtn = document.getElementById('modal-close-impressao');
    const gerarImpressaoBtn = document.getElementById('gerar-impressao-btn');
    const dataInicialInput = document.getElementById('data-inicial');
    const dataFinalInput = document.getElementById('data-final');
    const categoriaImpressaoSelect = document.getElementById('categoria-impressao');
    const capaImpressaoSelect = document.getElementById('capa-impressao');

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
            const dados = await response.json(); // Agora 'dados' contém { destaques: [...], noticias: [...] }

            // Pega a lista de IDs que devem ser destaque
            const idsDestaque = dados.destaques;

            // Mapeia a lista de notícias original, adicionando a propriedade 'destaque: true' se o ID estiver na lista de destaques
            const noticiasComDestaque = dados.noticias.map(noticia => {
                let categoria = (noticia.categoria || Object.keys(mapaCategorias).find(cat => 
                    mapaCategorias[cat].some(palavra => 
                        (noticia.titulo + ' ' + noticia.conteudo).toLowerCase().includes(palavra)
                    )
                ) || 'geral').toLowerCase();

                return { 
                    ...noticia, 
                    destaque: idsDestaque.includes(noticia.id),
                    categoria: categoria // Usa a categoria do JSON ou a automática
                };
            });

            // Agora, o resto do seu código funcionará como esperado!
            todasAsNoticias = noticiasComDestaque.sort((a, b) => new Date(b.data) - new Date(a.data));

            popularFiltros(todasAsNoticias);

            aplicarFiltros();

        } catch (error) {
            console.error('Erro ao carregar e processar notícias:', error);
            recentesContainer.innerHTML = '<p class="alert alert-error">Não foi possível carregar as notícias. Tente novamente mais tarde.</p>';
        }
    }

    function popularFiltros(noticias) {
        // 1. Pega todas as categorias e converte para minúsculas para evitar duplicatas.
        const categoriasBrutas = noticias.map(n => n.categoria.toLowerCase());
        
        // 2. Cria um conjunto de categorias únicas e depois converte de volta para um array.
        const categoriasUnicas = [...new Set(categoriasBrutas)];

        // 3. Formata o nome para ter a primeira letra maiúscula.
        const categoriasFormatadas = categoriasUnicas.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));

        // 4. Limpa os filtros de categoria existentes (mantendo a primeira opção "Todas").
        filtroCategoria.innerHTML = '<option value="todas">Todas as Notícias</option>';
        categoriaImpressaoSelect.innerHTML = '<option value="todas">Todas as Notícias</option>';

        // 5. Adiciona as categorias únicas e formatadas aos selects.
        const opcoesHTML = categoriasUnicas.map(cat => {
            const nomeFormatado = cat.charAt(0).toUpperCase() + cat.slice(1);
            return `<option value="${cat}">${nomeFormatado}</option>`;
        }).join('');

        filtroCategoria.innerHTML += opcoesHTML;
        categoriaImpressaoSelect.innerHTML += opcoesHTML;

        // Popula filtro de datas (Mês/Ano) - Lógica inalterada
        const datas = [...new Set(noticias.map(n => {
            const d = new Date(n.data + "T00:00:00");
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }))];
        
        // Limpa filtro de data antes de popular
        filtroData.innerHTML = '<option value="todas">Todas as Datas</option>';
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

        noticiasFiltradas = [...noticiasDestaque, ...noticiasNormais];

        paginaAtual = 1; 
        exibirDestaques(noticiasDestaque);
        exibirRecentes(noticiasNormais);

        // ===== LÓGICA DE VISIBILIDADE ADICIONADA AQUI =====
        const divisor = document.querySelector('.divider');
        const tituloRecentes = document.getElementById('titulo-recentes');

        // Mostra o divisor e o título apenas se AMBAS as seções tiverem conteúdo
        if (noticiasDestaque.length > 0 && noticiasNormais.length > 0) {
            divisor.style.display = 'block';
            tituloRecentes.style.display = 'block';
        } else {
            // Esconde se uma das seções estiver vazia para evitar separações desnecessárias
            divisor.style.display = 'none';
            tituloRecentes.style.display = 'none';
        }
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
            const isDestaque = noticia.destaque ? ' is-destaque' : '';
	        const destaqueBadge = noticia.destaque ? '<span class="badge badge-destaque">DESTAQUE</span>' : '';

            const cardHTML = `
	                <div class="card card-noticia${isDestaque}" data-id="${noticia.id}">
	                    <div class="noticia-imagem">
	                        <img src="${noticia.foto_principal}" alt="${noticia.titulo}" class="card-img-list">
	                    </div>
	                    <div class="noticia-conteudo">
	                        ${destaqueBadge}
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
                exibirRecentes(noticiasFiltradas.filter(n => !n.destaque));
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

        const urlNoticia = `${window.location.origin}${window.location.pathname}?noticia=${noticia.id}`;

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
                    <button id="share-btn" class="btn-share" title="Compartilhar">
                        Compartilhar
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

        // ===== LÓGICA DO BOTÃO COMPARTILHAR =====
        const shareBtn = document.getElementById('share-btn');
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: noticia.titulo,
                text: noticia.subtitulo,
                url: urlNoticia
            };

            try {
                // Tenta usar a API nativa de compartilhamento
                if (navigator.share) {
                    await navigator.share(shareData);
                    console.log('Notícia compartilhada com sucesso!');
                } else {
                    // Fallback: Copia a URL para a área de transferência
                    await navigator.clipboard.writeText(urlNoticia);
                    alert('Link da notícia copiado para a área de transferência!');
                }
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
                // Fallback caso o usuário cancele o compartilhamento ou ocorra um erro
                await navigator.clipboard.writeText(urlNoticia);
                alert('Não foi possível compartilhar, mas o link foi copiado para você!');
            }
        });
    }

    function abrirNoticiaFromURL() {
        const params = new URLSearchParams(window.location.search);
        const noticiaId = params.get('noticia');
        if (noticiaId) {
            // Aguarda um instante para garantir que as notícias já foram carregadas
            setTimeout(() => {
                // Verifica se a notícia existe antes de tentar abrir
                if (todasAsNoticias.some(n => n.id === noticiaId)) {
                    abrirModalComNoticia(noticiaId);
                } else {
                    console.warn('Notícia com ID da URL não encontrada.');
                }
            }, 500); // 500ms de espera
        }
    }

    function filtrarNoticiasParaImpressao(dataInicial, dataFinal, categoria) {
        let noticiasFiltradasImpressao = todasAsNoticias.filter(noticia => {
            const dataNoticia = new Date(noticia.data + "T00:00:00");
            let matchData = true;
            let matchCategoria = true;

            // Filtro por Data
            if (dataInicial) {
                const inicio = new Date(dataInicial + "T00:00:00");
                if (dataNoticia < inicio) {
                    matchData = false;
                }
            }
            if (dataFinal) {
                const final = new Date(dataFinal + "T00:00:00");
                if (dataNoticia > final) {
                    matchData = false;
                }
            }

            // Filtro por Categoria (reutilizando a lógica de palavras-chave)
            if (categoria !== 'todas') {
                const palavrasChave = mapaCategorias[categoria] || [];
                const textoCompleto = (noticia.titulo + ' ' + noticia.conteudo).toLowerCase();
                matchCategoria = palavrasChave.some(palavra => textoCompleto.includes(palavra));
            }

            return matchData && matchCategoria;
        });

        // Ordenar por data, mais recente primeiro
        return noticiasFiltradasImpressao.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    function gerarVisualizacaoImpressao(noticias, capaManual) {
        const printContainer = document.createElement('div');
        printContainer.id = 'print-content';
        printContainer.classList.add('jornal-print');

        const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        let htmlContent = `
            <div class="print-header">
                <h1 class="print-title">Jornal da Paróquia São Francisco de Assis</h1>
                <p class="print-date">Edição de ${dataAtual}</p>
            </div>
            <div class="print-grid">
        `;

        // 1. Define a Matéria de Capa
        let materiaCapa = capaManual;
        let noticiasRestantes = noticias;

        if (materiaCapa) {
            // Remove a capa manual da lista principal para não ser repetida
            noticiasRestantes = noticias.filter(n => n.id !== materiaCapa.id);
        } else {
            // Se não houver capa manual, pega a mais recente como capa
            materiaCapa = noticias[0];
            noticiasRestantes = noticias.slice(1);
        }

        if (materiaCapa) {
            htmlContent += `
                <div class="print-card print-capa">
                    <h2 class="print-card-title">${materiaCapa.titulo}</h2>
                    <p class="print-card-date">${new Date(materiaCapa.data + "T00:00:00").toLocaleDateString('pt-BR')}</p>
                    ${materiaCapa.foto_principal ? `<img src="${materiaCapa.foto_principal}" alt="${materiaCapa.titulo}" class="print-card-img">` : ''}
                    <p class="print-card-subtitle">${materiaCapa.subtitulo || ''}</p>
                    <div class="print-card-content">${materiaCapa.conteudo}</div>
                    ${materiaCapa.conteudo_adicional ? `<div class="print-card-extra">${materiaCapa.conteudo_adicional}</div>` : ''}
                </div>
            `;
        }

        // 2. Agrupa as notícias restantes por categoria
        const noticiasPorCategoria = noticiasRestantes.reduce((acc, noticia) => {
            const categoria = noticia.categoria || 'geral';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(noticia);
            return acc;
        }, {});

        // 3. Itera sobre as categorias na ordem desejada para montar o jornal
        const ordemCategorias = ['eventos', 'catequese', 'avisos', 'geral'];

        ordemCategorias.forEach(categoria => {
            if (noticiasPorCategoria[categoria] && noticiasPorCategoria[categoria].length > 0) {
                const noticiasDaCategoria = noticiasPorCategoria[categoria];
                
                // Título da Categoria
                htmlContent += `<h2 class="print-category-title">${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h2>`;

                // Separa destaques e notícias normais DENTRO da categoria
                const destaquesSecundarios = noticiasDaCategoria.filter(n => n.destaque).slice(0, 2);
                const idsDestaques = destaquesSecundarios.map(d => d.id);
                const noticiasNormais = noticiasDaCategoria.filter(n => !idsDestaques.includes(n.id));

                // Renderiza Destaques Secundários da categoria
                if (destaquesSecundarios.length > 0) {
                    htmlContent += `<div class="print-secondary-highlights">`;
                    destaquesSecundarios.forEach(noticia => {
                        htmlContent += `
                            <div class="print-card print-destaque-secundario">
                                <h3 class="print-card-title">${noticia.titulo}</h3>
                                <p class="print-card-date">${new Date(noticia.data + "T00:00:00").toLocaleDateString('pt-BR')}</p>
                                ${noticia.foto_principal ? `<img src="${noticia.foto_principal}" alt="${noticia.titulo}" class="print-card-img">` : ''}
                                <div class="print-card-content">${noticia.conteudo.substring(0, 250)}...</div>
                            </div>
                        `;
                    });
                    htmlContent += `</div>`;
                }

                // Renderiza Notícias normais da categoria
                noticiasNormais.forEach(noticia => {
                    htmlContent += `
                        <div class="print-card print-normal">
                            <h4 class="print-card-title">${noticia.titulo}</h4>
                            <p class="print-card-date">${new Date(noticia.data + "T00:00:00").toLocaleDateString('pt-BR')}</p>
                            <div class="print-card-content">${noticia.conteudo}</div>
                        </div>
                    `;
                });
            }
        });

        htmlContent += `</div>`; // Fecha print-grid
        printContainer.innerHTML = htmlContent;

        // Injeta o container no corpo e prepara para impressão
        document.body.appendChild(printContainer);
        document.body.classList.add('print-active');

        setTimeout(() => {
            window.print();

            // Espera o evento de foco — disparado quando o usuário fecha o diálogo de impressão
            window.onafterprint = () => {
                document.body.removeChild(printContainer);
                document.body.classList.remove('print-active');
                window.onafterprint = null; // limpa o listener
            };
        }, 500);
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

    imprimirBtn.addEventListener('click', () => {
        atualizarSeletorDeCapa(); 
        modalImpressao.classList.add('active');
    });

    closeModalImpressaoBtn.addEventListener('click', () => {
        modalImpressao.classList.remove('active');
    });

    function atualizarSeletorDeCapa() {
        const noticiasFiltradasParaImpressao = filtrarNoticiasParaImpressao(
            dataInicialInput.value, 
            dataFinalInput.value, 
            categoriaImpressaoSelect.value
        );
        popularSeletorDeCapa(noticiasFiltradasParaImpressao);
    }

    // Adiciona os eventos de 'change' para chamar a função auxiliar
    dataInicialInput.addEventListener('change', atualizarSeletorDeCapa);
    dataFinalInput.addEventListener('change', atualizarSeletorDeCapa);
    categoriaImpressaoSelect.addEventListener('change', atualizarSeletorDeCapa);

    gerarImpressaoBtn.addEventListener('click', () => {
        const dataInicial = dataInicialInput.value;
        const dataFinal = dataFinalInput.value;
        const categoria = categoriaImpressaoSelect.value;
        const idCapaSelecionada = capaImpressaoSelect.value; // Pega o ID da capa escolhida

        const noticiasParaImpressao = filtrarNoticiasParaImpressao(dataInicial, dataFinal, categoria);

        if (noticiasParaImpressao.length === 0) {
            alert('Nenhuma notícia encontrada com os filtros selecionados.');
            return;
        }

        // Reorganiza a lista de notícias com base na capa selecionada
        let noticiasOrganizadas = [];
        if (idCapaSelecionada && idCapaSelecionada !== 'auto') {
            const capaIndex = noticiasParaImpressao.findIndex(n => n.id === idCapaSelecionada);
            if (capaIndex > -1) {
                const [capa] = noticiasParaImpressao.splice(capaIndex, 1); // Remove a capa da lista
                noticiasOrganizadas = [capa, ...noticiasParaImpressao]; // Coloca a capa no início
            } else {
                noticiasOrganizadas = noticiasParaImpressao; // Caso não encontre, usa a ordem padrão
            }
        } else {
            noticiasOrganizadas = noticiasParaImpressao; // Ordem padrão (mais recente primeiro)
        }

        gerarVisualizacaoImpressao(noticiasOrganizadas);
        modalImpressao.classList.remove('active');
    });

    function popularSeletorDeCapa(noticias) {
        // Limpa opções antigas, mantendo a primeira
        capaImpressaoSelect.innerHTML = '<option value="auto">Destaque Automático (mais recente)</option>';

        let noticiasParaCapa = noticias.filter(noticia => noticia.destaque);

        if (noticiasParaCapa.length === 0) {
            noticiasParaCapa = noticias;
        }

        if (noticiasParaCapa.length > 0) {
            // Use 'noticiasParaCapa' aqui, e não 'noticias'
            const opcoesHTML = noticiasParaCapa.map(noticia => {
                const tituloCurto = noticia.titulo.length > 50 ? noticia.titulo.substring(0, 50) + '...' : noticia.titulo;
                return `<option value="${noticia.id}">${tituloCurto}</option>`;
            }).join('');
            
            capaImpressaoSelect.innerHTML += opcoesHTML;
        }
    }

    async function init() {
        await carregarNoticias();
        abrirNoticiaFromURL(); // Chama a função depois de carregar tudo
        initMobileMenu();
    }

    init();
});
