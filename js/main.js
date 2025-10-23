// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initMobileMenu();
    initSmoothScroll();
    initModals();
    loadContent();
    carregarProximaMissaFestiva();
    carregarProximoEvento();
    carregarInfoAleatoria();
    initJogosToast();
});

async function carregarInfoAleatoria() {
    try {
        const response = await fetch('data/informacoes.json');
        const data = await response.json();
        const informacoes = data.informacoes;

        // Escolhe um índice aleatório da lista de informações
        const indiceAleatorio = Math.floor(Math.random() * informacoes.length);
        const info = informacoes[indiceAleatorio];

        const card = document.getElementById('card-info-aleatoria');
        if (card && info) {
            card.querySelector('h3').textContent = info.titulo;
            card.querySelector('.highlight-time').textContent = info.subtitulo;
            card.querySelector('p:last-of-type').textContent = info.texto;
        }
    } catch (error) {
        console.error('Erro ao carregar informação aleatória:', error);
    }
}

async function carregarProximoEvento() {
    try {
        const response = await fetch('data/eventos.json');
        const data = await response.json();
        
        const todosEventos = [];
        // Coleta todos os eventos de todos os anos e meses em uma única lista
        for (const ano in data.anos) {
            for (const mes in data.anos[ano]) {
                data.anos[ano][mes].forEach(evento => {
                    todosEventos.push(evento);
                });
            }
        }

        // Ordena os eventos por data
        todosEventos.sort((a, b) => new Date(a.data) - new Date(b.data));

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Encontra o primeiro evento futuro
        const proximoEvento = todosEventos.find(evento => {
            // Adiciona 'T00:00:00' para garantir que a data seja interpretada no fuso local
            const dataEvento = new Date(evento.data + "T00:00:00");
            return dataEvento >= hoje;
        });

        const card = document.getElementById('card-proximo-evento');
        if (card && proximoEvento) {
            const dataEventoCorreta = new Date(proximoEvento.data + "T00:00:00");
            const dataFormatada = dataEventoCorreta.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

            card.querySelector('h3').textContent = proximoEvento.titulo;
            card.querySelector('.highlight-time').textContent = `${dataFormatada}, ${proximoEvento.horario}`;
            // Usamos uma versão curta da descrição para o card
            card.querySelector('p:last-of-type').textContent = proximoEvento.descricao.substring(0, 50) + '...';
        } else if (card) {
            card.querySelector('.highlight-time').textContent = "Nenhum evento agendado.";
            card.querySelector('p:last-of-type').textContent = "Fique atento para futuras atualizações.";
        }
    } catch (error) {
        console.error('Erro ao carregar próximo evento:', error);
    }
}

async function carregarProximaMissaFestiva() {
    try {
        const response = await fetch('data/missas-festivas.json');
        const data = await response.json();
        const missas = data.missas_festivas;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas a data

        // Encontra a primeira missa cuja data é hoje ou no futuro
        const proximaMissa = missas.find(missa => new Date(missa.data + "T00:00:00") >= hoje);

        const card = document.getElementById('card-missa-festiva');
        if (card && proximaMissa) {
            const dataFormatada = new Date(proximaMissa.data + "T00:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
            
            card.querySelector('h3').textContent = proximaMissa.titulo;
            card.querySelector('.highlight-time').textContent = `${dataFormatada}, ${proximaMissa.horario}`;
            card.querySelector('p:last-of-type').textContent = proximaMissa.descricao;
        } else if (card) {
            // Mensagem caso não haja mais missas futuras no JSON
            card.querySelector('.highlight-time').textContent = "Nenhuma missa festiva agendada.";
            card.querySelector('p:last-of-type').textContent = "Consulte a secretaria para mais informações.";
        }
    } catch (error) {
        console.error('Erro ao carregar missas festivas:', error);
    }
}

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault(); // só bloqueia se for âncora interna
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    // Update active nav link
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Scroll to section
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Close mobile menu if open
                    closeMobileMenu();
                }
            }
            // se não for "#", deixa o navegador seguir normalmente
        });
    });
    
    // Handle scroll spy
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });
        
        // Close menu on window resize
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

// Smooth scroll functionality
function initSmoothScroll() {
    // Already handled in navigation, but can be extended for other links
    const allLinks = document.querySelectorAll('a[href^="#"]');
    
    allLinks.forEach(link => {
        if (!link.classList.contains('nav-link')) {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        }
    });
}

// Modal functionality
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const modalCloses = document.querySelectorAll('.modal-close');
    
    // Close modal when clicking close button
    modalCloses.forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Load content from JSON files
async function loadContent() {
    try {
        // Load all data
        const [historiaData, missasData, eventosData, fotosData] = await Promise.all([
            fetch('data/historia.json').then(r => r.json()),
            fetch('data/missas.json').then(r => r.json()),
            fetch('data/eventos.json').then(r => r.json()),
            fetch('data/fotos.json').then(r => r.json())
        ]);
        
        // Populate content
        populateTimeline(historiaData);
        populateMissas(missasData);
        populateEventos(eventosData);
        populateGaleria(fotosData);
        
    } catch (error) {
        console.error('Error loading content:', error);
        showErrorMessage('Erro ao carregar conteúdo. Tente recarregar a página.');
    }
}

// Populate timeline
function populateTimeline(data) {
    const timeline = document.getElementById('timeline');
    const timelineDetails = document.getElementById('timeline-details');
    
    if (!timeline || !data.timeline) return;
    
    timeline.innerHTML = '';
    
    data.timeline.forEach((item, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <div class="timeline-point"></div>
            <div class="timeline-content">
                <div class="timeline-year">${item.ano}</div>
                <div class="timeline-title">${item.titulo}</div>
            </div>
        `;
        
        timelineItem.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update details
            timelineDetails.innerHTML = `
                <div class="timeline-detail-card">
                    <h3>${item.titulo} (${item.ano})</h3>
                    <img src="${item.imagem}" alt="${item.titulo}" onerror="this.style.display='none'">
                    <p>${item.descricao}</p>
                </div>
            `;
        });
        
        timeline.appendChild(timelineItem);
        
        // Auto-select first item
        if (index === 0) {
            timelineItem.click();
        }
    });
}

// Populate missas
function populateMissas(data) {
    const horariosGrid = document.getElementById('horarios-grid');
    const eventosEspeciaisGrid = document.getElementById('eventos-especiais-grid');
    
    if (!horariosGrid || !data.horarios_regulares) return;
    
    // Regular schedules
    horariosGrid.innerHTML = '';
    Object.entries(data.horarios_regulares).forEach(([dia, info]) => {
        const card = document.createElement('div');
        card.className = `horario-card ${info.destaque ? 'destaque' : ''}`;
        card.innerHTML = `
            <div class="horario-dia">${dia}</div>
            <ul class="horario-lista">
                ${info.horarios.map(horario => `<li>${horario}</li>`).join('')}
            </ul>
            ${info.observacao ? `<div class="horario-observacao">${info.observacao}</div>` : ''}
        `;
        horariosGrid.appendChild(card);
    });
    
    // Special events
    if (eventosEspeciaisGrid && data.eventos_especiais) {
        eventosEspeciaisGrid.innerHTML = '';
        data.eventos_especiais.forEach(evento => {
            const card = document.createElement('div');
            card.className = 'evento-especial-card';
            card.innerHTML = `
                <img src="${evento.imagem}" alt="${evento.nome}" onerror="this.style.display='none'">
                <div class="evento-especial-content">
                    <h4>${evento.nome}</h4>
                    <div class="evento-especial-data">${formatDate(evento.data)} - ${evento.horario}</div>
                    <p>${evento.descricao}</p>
                </div>
            `;
            eventosEspeciaisGrid.appendChild(card);
        });
    }
}

// Populate eventos
function populateEventos(data) {
    const eventosList = document.getElementById('eventos-list');
    
    if (!eventosList || !data.anos) return;
    
    eventosList.innerHTML = '';
    
    Object.entries(data.anos).forEach(([ano, meses]) => {
        const totalEventos = Object.values(meses).reduce((total, eventos) => total + eventos.length, 0);
        
        const eventoAno = document.createElement('div');
        eventoAno.className = 'evento-ano';
        eventoAno.innerHTML = `
            <div class="evento-ano-header">
                <span class="evento-ano-title">${ano}</span>
                <span class="evento-ano-count">${totalEventos} eventos</span>
            </div>
            <div class="evento-ano-content">
                ${Object.entries(meses).map(([mes, eventos]) => `
                    <div class="evento-mes">
                        <div class="evento-mes-header">
                            <span class="evento-mes-title">${mes}</span>
                            <span class="evento-mes-count">${eventos.length} eventos</span>
                        </div>
                        <div class="evento-mes-content">
                            ${eventos.map(evento => `
                                <div class="evento-item" onclick="showEventoDetails('${evento.id}')">
                                    <div class="evento-titulo">${evento.titulo}</div>
                                    <div class="evento-data-local">${formatDate(evento.data)} - ${evento.local}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers for accordion
        const header = eventoAno.querySelector('.evento-ano-header');
        const content = eventoAno.querySelector('.evento-ano-content');
        
        header.addEventListener('click', function() {
            content.classList.toggle('active');
        });
        
        // Add click handlers for months
        eventoAno.querySelectorAll('.evento-mes-header').forEach(mesHeader => {
            mesHeader.addEventListener('click', function(e) {
                e.stopPropagation();
                const mesContent = this.nextElementSibling;
                mesContent.classList.toggle('active');
            });
        });
        
        eventosList.appendChild(eventoAno);
    });
}

// Show event details
function showEventoDetails(eventoId) {
    // This would fetch the specific event data and show in modal
    // For now, we'll show a placeholder
    const modalContent = document.getElementById('evento-modal-content');
    modalContent.innerHTML = `
        <h3>Detalhes do Evento</h3>
        <p>Carregando detalhes do evento ${eventoId}...</p>
    `;
    openModal('evento-modal');
}

// Populate galeria
function populateGaleria(data) {
    const galeriaGrid = document.getElementById('galeria-grid');
    
    if (!galeriaGrid || !data.secoes) return;
    
    galeriaGrid.innerHTML = '';
    
    Object.entries(data.secoes).forEach(([key, secao]) => {
        const galeriaSecao = document.createElement('div');
        galeriaSecao.className = 'galeria-secao';
        galeriaSecao.innerHTML = `
            <img src="${secao.thumbnail}" alt="${secao.nome}" onerror="this.src='images/galeria/placeholder.jpg'">
            <div class="galeria-secao-content">
                <h3>${secao.nome}</h3>
                <div class="galeria-secao-count">${secao.total_fotos} fotos</div>
                <p>${secao.descricao}</p>
            </div>
        `;
        
        galeriaSecao.addEventListener('click', function() {
            showGaleriaSecao(key, secao);
        });
        
        galeriaGrid.appendChild(galeriaSecao);
    });
}

// Show galeria section
function showGaleriaSecao(key, secao) {
    const modalContent = document.getElementById('foto-modal-content');
    
    let subgaleriasHTML = '';
    if (secao.subgalerias) {
        subgaleriasHTML = secao.subgalerias.map(sub => `
            <div class="subgaleria">
                <h4>${sub.nome}</h4>
                <div class="image-grid">
                    ${sub.fotos.map(foto => {
                        const imgSrc = foto.startsWith('http' ) ? foto : secao.pasta + foto;
                        return`
                        <div class="image-item">
                            <img src="${imgSrc}" alt="${sub.nome}" onerror="this.src='images/galeria/placeholder.jpg'">
                            <div class="image-overlay">
                                <span>Ver imagem</span>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `).join('');
    }
    
    modalContent.innerHTML = `
        <h3>${secao.nome}</h3>
        <p>${secao.descricao}</p>
        <div class="galeria-content">
            ${subgaleriasHTML}
        </div>
    `;
    
    openModal('foto-modal');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.innerHTML = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Loading state management
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading"></div>';
    }
}

function hideLoading(element) {
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}

// Intersection Observer for animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate
    document.querySelectorAll('.card, .timeline-item, .highlight-card').forEach(el => {
        observer.observe(el);
    });
}

// Função para controlar o balão flutuante de convite para os jogos
function initJogosToast() {
    const jogosToast = document.getElementById('jogos-toast');
    const closeBtn = document.getElementById('jogos-toast-close');

    if (!jogosToast || !closeBtn) return;

    // Função para fechar o toast
    const closeToast = () => {
        jogosToast.classList.remove('show');
    };

    // Verifica se o usuário já viu o toast nesta sessão
    if (sessionStorage.getItem('jogosToastVisto')) {
        return;
    }

    // Abre o toast após 5 segundos
    setTimeout(() => {
        jogosToast.classList.add('show');
        sessionStorage.setItem('jogosToastVisto', 'true'); // Marca como visto
    }, 5000);

    // Fecha ao clicar no 'X'
    closeBtn.addEventListener('click', closeToast);
}

// Initialize scroll animations after content is loaded
setTimeout(initScrollAnimations, 1000);

