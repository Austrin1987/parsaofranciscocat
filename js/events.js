// Events system functionality
class EventsManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = null;
        this.currentFilters = {
            year: 'all',
            month: 'all',
            search: ''
        };
        this.init();
    }
    
    async init() {
        try {
            const response = await fetch('data/eventos.json');
            this.data = await response.json();
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Error loading events data:', error);
        }
    }
    
    render() {
        if (!this.container || !this.data) return;
        
        const filteredData = this.applyFilters();
        const eventsHTML = this.generateEventsHTML(filteredData);
        
        this.container.innerHTML = eventsHTML;
        this.bindAccordionEvents();
    }
    
    generateEventsHTML(data) {
        if (!data.anos || Object.keys(data.anos).length === 0) {
            return '<div class="no-events">Nenhum evento encontrado.</div>';
        }
        
        return Object.entries(data.anos)
            .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort years descending
            .map(([ano, meses]) => {
                const totalEventos = Object.values(meses).reduce((total, eventos) => total + eventos.length, 0);
                
                return `
                    <div class="evento-ano" data-year="${ano}">
                        <div class="evento-ano-header">
                            <div class="evento-ano-info">
                                <span class="evento-ano-title">${ano}</span>
                                <span class="evento-ano-count">${totalEventos} evento${totalEventos !== 1 ? 's' : ''}</span>
                            </div>
                            <div class="evento-ano-toggle">
                                <span class="toggle-icon">▼</span>
                            </div>
                        </div>
                        <div class="evento-ano-content">
                            ${this.generateMesesHTML(meses, ano)}
                        </div>
                    </div>
                `;
            }).join('');
    }
    
    generateMesesHTML(meses, ano) {
        const monthNames = {
            'janeiro': 'Janeiro', 'fevereiro': 'Fevereiro', 'março': 'Março',
            'abril': 'Abril', 'maio': 'Maio', 'junho': 'Junho',
            'julho': 'Julho', 'agosto': 'Agosto', 'setembro': 'Setembro',
            'outubro': 'Outubro', 'novembro': 'Novembro', 'dezembro': 'Dezembro'
        };
        
        return Object.entries(meses)
            .sort(([a], [b]) => {
                const monthOrder = Object.keys(monthNames);
                return monthOrder.indexOf(a.toLowerCase()) - monthOrder.indexOf(b.toLowerCase());
            })
            .map(([mes, eventos]) => `
                <div class="evento-mes" data-month="${mes}" data-year="${ano}">
                    <div class="evento-mes-header">
                        <div class="evento-mes-info">
                            <span class="evento-mes-title">${monthNames[mes] || mes}</span>
                            <span class="evento-mes-count">${eventos.length} evento${eventos.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="evento-mes-toggle">
                            <span class="toggle-icon">▼</span>
                        </div>
                    </div>
                    <div class="evento-mes-content">
                        ${this.generateEventosHTML(eventos)}
                    </div>
                </div>
            `).join('');
    }
    
    generateEventosHTML(eventos) {
        return eventos.map(evento => `
            <div class="evento-item" data-evento-id="${evento.id}">
                <div class="evento-item-content">
                    <div class="evento-titulo">${evento.titulo}</div>
                    <div class="evento-meta">
                        <span class="evento-data">${this.formatDate(evento.data)}</span>
                        <span class="evento-horario">${evento.horario}</span>
                        <span class="evento-local">${evento.local}</span>
                    </div>
                    <div class="evento-organizador">Organizado por: ${evento.organizador}</div>
                </div>
                <div class="evento-actions">
                    <button class="btn-evento-details" onclick="eventsManager.showEventDetails('${evento.id}')">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('events-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.debounce(() => this.render(), 300);
            });
        }
        
        // Year filter
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            yearFilter.addEventListener('change', (e) => {
                this.currentFilters.year = e.target.value;
                this.render();
            });
        }
        
        // Month filter
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) {
            monthFilter.addEventListener('change', (e) => {
                this.currentFilters.month = e.target.value;
                this.render();
            });
        }
    }
    
    bindAccordionEvents() {
        // Year accordion
        this.container.querySelectorAll('.evento-ano-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const anoElement = header.parentElement;
                const content = anoElement.querySelector('.evento-ano-content');
                const icon = header.querySelector('.toggle-icon');
                
                content.classList.toggle('active');
                icon.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });
        
        // Month accordion
        this.container.querySelectorAll('.evento-mes-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const mesElement = header.parentElement;
                const content = mesElement.querySelector('.evento-mes-content');
                const icon = header.querySelector('.toggle-icon');
                
                content.classList.toggle('active');
                icon.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });
        
        // Event item hover effects
        this.container.querySelectorAll('.evento-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.classList.add('hover');
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('hover');
            });
        });
    }
    
    applyFilters() {
        if (!this.data) return { anos: {} };
        
        let filteredData = { anos: {} };
        
        Object.entries(this.data.anos).forEach(([ano, meses]) => {
            // Year filter
            if (this.currentFilters.year !== 'all' && ano !== this.currentFilters.year) {
                return;
            }
            
            let filteredMeses = {};
            
            Object.entries(meses).forEach(([mes, eventos]) => {
                // Month filter
                if (this.currentFilters.month !== 'all' && mes !== this.currentFilters.month) {
                    return;
                }
                
                // Search filter
                let filteredEventos = eventos;
                if (this.currentFilters.search) {
                    const searchTerm = this.currentFilters.search.toLowerCase();
                    filteredEventos = eventos.filter(evento => 
                        evento.titulo.toLowerCase().includes(searchTerm) ||
                        evento.descricao.toLowerCase().includes(searchTerm) ||
                        evento.local.toLowerCase().includes(searchTerm) ||
                        evento.organizador.toLowerCase().includes(searchTerm)
                    );
                }
                
                if (filteredEventos.length > 0) {
                    filteredMeses[mes] = filteredEventos;
                }
            });
            
            if (Object.keys(filteredMeses).length > 0) {
                filteredData.anos[ano] = filteredMeses;
            }
        });
        
        return filteredData;
    }
    
    showEventDetails(eventoId) {
        const evento = this.findEventById(eventoId);
        if (!evento) return;
        
        const modalContent = document.getElementById('evento-modal-content');
        if (!modalContent) return;
        
        const fotosHTML = evento.fotos && evento.fotos.length > 0 ? `
            <div class="evento-fotos">
                <h4>Fotos do Evento</h4>
                <div class="image-grid">
                    ${evento.fotos.map(foto => `
                        <div class="image-item" onclick="openImageModal('images/eventos/${foto}')">
                            <img src="images/eventos/${foto}" alt="${evento.titulo}" onerror="this.style.display='none'">
                            <div class="image-overlay">
                                <span>Ver imagem</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        const videosHTML = evento.videos && evento.videos.length > 0 ? `
            <div class="evento-videos">
                <h4>Vídeos do Evento</h4>
                <div class="videos-grid">
                    ${evento.videos.map(video => `
                        <div class="video-item">
                            <video controls>
                                <source src="images/eventos/${video}" type="video/mp4">
                                Seu navegador não suporta vídeos.
                            </video>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        modalContent.innerHTML = `
            <div class="evento-details">
                <div class="evento-header">
                    <h3>${evento.titulo}</h3>
                    <div class="evento-meta-details">
                        <div class="meta-item">
                            <strong>Data:</strong> ${this.formatDate(evento.data)}
                        </div>
                        <div class="meta-item">
                            <strong>Horário:</strong> ${evento.horario}
                        </div>
                        <div class="meta-item">
                            <strong>Local:</strong> ${evento.local}
                        </div>
                        <div class="meta-item">
                            <strong>Organizador:</strong> ${evento.organizador}
                        </div>
                    </div>
                </div>
                
                <div class="evento-description">
                    <h4>Descrição</h4>
                    <p>${evento.descricao}</p>
                </div>
                
                ${fotosHTML}
                ${videosHTML}
            </div>
        `;
        
        openModal('evento-modal');
    }
    
    findEventById(eventoId) {
        if (!this.data) return null;
        
        for (const [ano, meses] of Object.entries(this.data.anos)) {
            for (const [mes, eventos] of Object.entries(meses)) {
                const evento = eventos.find(e => e.id === eventoId);
                if (evento) return evento;
            }
        }
        return null;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        });
    }
    
    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }
    
    // Export events to calendar
    exportToCalendar(eventoId) {
        const evento = this.findEventById(eventoId);
        if (!evento) return;
        
        const startDate = new Date(evento.data + 'T' + evento.horario);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
        
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Paróquia São José//Eventos//PT
BEGIN:VEVENT
UID:${evento.id}@paroquiasaojose.org.br
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${evento.titulo}
DESCRIPTION:${evento.descricao}
LOCATION:${evento.local}
ORGANIZER:${evento.organizador}
END:VEVENT
END:VCALENDAR`;
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${evento.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Share event
    shareEvent(eventoId) {
        const evento = this.findEventById(eventoId);
        if (!evento) return;
        
        const shareData = {
            title: evento.titulo,
            text: `${evento.titulo} - ${this.formatDate(evento.data)} às ${evento.horario} em ${evento.local}`,
            url: `${window.location.origin}${window.location.pathname}#eventos`
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
                .then(() => {
                    alert('Link do evento copiado para a área de transferência!');
                });
        }
    }
}

// Create events filters
function createEventsFilters() {
    const filtersHTML = `
        <div class="events-filters">
            <div class="filter-row">
                <div class="search-box">
                    <input type="text" id="events-search" placeholder="Buscar eventos..." class="search-input">
                    <button class="search-button">🔍</button>
                </div>
                
                <select id="year-filter" class="filter-select">
                    <option value="all">Todos os anos</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                </select>
                
                <select id="month-filter" class="filter-select">
                    <option value="all">Todos os meses</option>
                    <option value="janeiro">Janeiro</option>
                    <option value="fevereiro">Fevereiro</option>
                    <option value="março">Março</option>
                    <option value="abril">Abril</option>
                    <option value="maio">Maio</option>
                    <option value="junho">Junho</option>
                    <option value="julho">Julho</option>
                    <option value="agosto">Agosto</option>
                    <option value="setembro">Setembro</option>
                    <option value="outubro">Outubro</option>
                    <option value="novembro">Novembro</option>
                    <option value="dezembro">Dezembro</option>
                </select>
                
                <button class="btn btn-secondary" onclick="resetEventsFilters()">
                    Limpar Filtros
                </button>
            </div>
        </div>
    `;
    
    const eventosSection = document.getElementById('eventos');
    if (eventosSection) {
        const sectionHeader = eventosSection.querySelector('.section-header');
        sectionHeader.insertAdjacentHTML('afterend', filtersHTML);
    }
}

function resetEventsFilters() {
    if (window.eventsManager) {
        window.eventsManager.currentFilters = {
            year: 'all',
            month: 'all',
            search: ''
        };
        
        document.getElementById('events-search').value = '';
        document.getElementById('year-filter').value = 'all';
        document.getElementById('month-filter').value = 'all';
        
        window.eventsManager.render();
    }
}

function openImageModal(imageSrc) {
    const modalContent = document.getElementById('foto-modal-content');
    modalContent.innerHTML = `
        <div class="image-modal-content">
            <img src="${imageSrc}" alt="Imagem do evento" style="max-width: 100%; height: auto;">
        </div>
    `;
    openModal('foto-modal');
}

// Initialize events manager
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.eventsManager = new EventsManager('eventos-list');
        createEventsFilters();
    }, 500);
});

