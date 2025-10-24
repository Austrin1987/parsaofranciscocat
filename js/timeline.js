// Timeline specific functionality
class Timeline {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.currentIndex = 0;
        this.init();
    }
    
    init() {
        if (!this.container || !this.data) return;
        
        this.render();
        this.bindEvents();
        this.autoPlay();
    }
    
    render() {
        const timelineHTML = this.data.timeline.map((item, index) => `
            <div class="timeline-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="timeline-point ${item.destaque ? 'destaque' : ''}"></div>
                <div class="timeline-content">
                    <div class="timeline-year">${item.ano}</div>
                    <div class="timeline-title">${item.titulo}</div>
                    ${item.destaque ? '<div class="timeline-badge">Marco Importante</div>' : ''}
                </div>
            </div>
        `).join('');
        
        this.container.innerHTML = timelineHTML;
    }
    
    bindEvents() {
        const items = this.container.querySelectorAll('.timeline-item');
        
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.setActive(index);
            });
            
            // Add hover effects
            item.addEventListener('mouseenter', () => {
                this.pauseAutoPlay();
            });
            
            item.addEventListener('mouseleave', () => {
                this.resumeAutoPlay();
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.container.querySelector('.timeline-item.active')) {
                switch(e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        this.previous();
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        this.next();
                        break;
                }
            }
        });
    }
    
    setActive(index) {
        if (index < 0 || index >= this.data.timeline.length) return;
        
        // Remove active class from all items
        this.container.querySelectorAll('.timeline-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected item
        const activeItem = this.container.querySelector(`[data-index="${index}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            this.currentIndex = index;
            
            // Update details panel
            this.updateDetails(this.data.timeline[index]);
            
            // Scroll item into view if needed
            this.scrollToItem(activeItem);
        }
    }
    
    updateDetails(item) {
        const detailsContainer = document.getElementById('timeline-details');
        if (!detailsContainer) return;
        
        const detailsHTML = `
            <div class="timeline-detail-card">
                <div class="timeline-detail-header">
                    <h3>${item.titulo}</h3>
                    <span class="timeline-detail-year">${item.ano}</span>
                </div>
                <div class="timeline-detail-body">
                    <img src="${item.imagem}" alt="${item.titulo}" class="timeline-detail-image" onerror="this.style.display='none'">
                    <p class="timeline-detail-description">${item.descricao}</p>
                    ${item.destaque ? '<div class="timeline-detail-badge">Marco Importante</div>' : ''}
                </div>
                <div class="timeline-detail-navigation">
                    <button class="btn-timeline-nav" onclick="timeline.previous()" ${this.currentIndex === 0 ? 'disabled' : ''}>
                        ← Anterior
                    </button>
                    <span class="timeline-counter">${this.currentIndex + 1} de ${this.data.timeline.length}</span>
                    <button class="btn-timeline-nav" onclick="timeline.next()" ${this.currentIndex === this.data.timeline.length - 1 ? 'disabled' : ''}>
                        Próximo →
                    </button>
                </div>
            </div>
        `;
        
        detailsContainer.innerHTML = detailsHTML;
        
        // Add fade-in animation
        detailsContainer.querySelector('.timeline-detail-card').style.opacity = '0';
        setTimeout(() => {
            detailsContainer.querySelector('.timeline-detail-card').style.opacity = '1';
        }, 50);
    }
    
    scrollToItem(item) {
        const containerRect = this.container.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    next() {
        const nextIndex = (this.currentIndex + 1) % this.data.timeline.length;
        this.setActive(nextIndex);
    }
    
    previous() {
        const prevIndex = this.currentIndex === 0 ? this.data.timeline.length - 1 : this.currentIndex - 1;
        this.setActive(prevIndex);
    }
    
    autoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (!this.isPaused) {
                this.next();
            }
        }, 8000); // Change every 8 seconds
    }
    
    pauseAutoPlay() {
        this.isPaused = true;
    }
    
    resumeAutoPlay() {
        this.isPaused = false;
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
    
    // Touch/swipe support for mobile
    initTouchEvents() {
        let startX = 0;
        let startY = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        this.container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Determine if it's a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previous();
                } else {
                    this.next();
                }
            }
        });
    }
    
    // Filter timeline by decade
    filterByDecade(decade) {
        const items = this.container.querySelectorAll('.timeline-item');
        
        items.forEach(item => {
            const year = parseInt(item.querySelector('.timeline-year').textContent);
            const itemDecade = Math.floor(year / 10) * 10;
            
            if (decade === 'all' || itemDecade === decade) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Search timeline
    search(query) {
        const items = this.container.querySelectorAll('.timeline-item');
        const searchTerm = query.toLowerCase();
        
        items.forEach(item => {
            const title = item.querySelector('.timeline-title').textContent.toLowerCase();
            const year = item.querySelector('.timeline-year').textContent;
            
            if (title.includes(searchTerm) || year.includes(searchTerm)) {
                item.style.display = 'block';
                item.classList.add('search-highlight');
            } else {
                item.style.display = 'none';
                item.classList.remove('search-highlight');
            }
        });
    }
    
    // Reset filters
    resetFilters() {
        const items = this.container.querySelectorAll('.timeline-item');
        items.forEach(item => {
            item.style.display = 'block';
            item.classList.remove('search-highlight');
        });
    }
}

// Timeline controls
function createTimelineControls() {
    const controlsHTML = `
        <div class="timeline-controls">
            <div class="timeline-filters">
                <select id="decade-filter" onchange="filterTimeline(this.value)">
                    <option value="all">Todas as décadas</option>
                    <option value="1950">1950s</option>
                    <option value="1960">1960s</option>
                    <option value="1970">1970s</option>
                    <option value="1980">1980s</option>
                    <option value="1990">1990s</option>
                    <option value="2000">2000s</option>
                    <option value="2010">2010s</option>
                    <option value="2020">2020s</option>
                </select>
                
                <div class="search-box">
                    <input class="search-input" type="text" id="timeline-search" placeholder="Buscar na história..." onkeyup="searchTimeline(this.value)">
                    <button class="search-button" onclick="searchTimeline(document.getElementById('timeline-search').value)">
                        🔍
                    </button>
                </div>
                
                <button class="btn btn-secondary" onclick="resetTimelineFilters()">
                    Limpar Filtros
                </button>
            </div>
            
            <div class="timeline-playback">
                <button class="btn-timeline-control" onclick="timeline.previous()" title="Anterior">
                    ⏮
                </button>
                <button class="btn-timeline-control" onclick="toggleAutoPlay()" title="Play/Pause" id="play-pause-btn">
                    ⏸
                </button>
                <button class="btn-timeline-control" onclick="timeline.next()" title="Próximo">
                    ⏭
                </button>
            </div>
        </div>
    `;
    
    const historiaSection = document.getElementById('historia');
    if (historiaSection) {
        const sectionHeader = historiaSection.querySelector('.section-header');
        sectionHeader.insertAdjacentHTML('afterend', controlsHTML);
    }
}

// Control functions
function filterTimeline(decade) {
    if (window.timeline) {
        if (decade === 'all') {
            window.timeline.resetFilters();
        } else {
            window.timeline.filterByDecade(parseInt(decade));
        }
    }
}

function searchTimeline(query) {
    if (window.timeline) {
        if (query.trim() === '') {
            window.timeline.resetFilters();
        } else {
            window.timeline.search(query);
        }
    }
}

function resetTimelineFilters() {
    if (window.timeline) {
        window.timeline.resetFilters();
        document.getElementById('decade-filter').value = 'all';
        document.getElementById('timeline-search').value = '';
    }
}

function toggleAutoPlay() {
    const btn = document.getElementById('play-pause-btn');
    if (window.timeline) {
        if (window.timeline.isPaused) {
            window.timeline.resumeAutoPlay();
            btn.textContent = '⏸';
            btn.title = 'Pausar';
        } else {
            window.timeline.pauseAutoPlay();
            btn.textContent = '▶';
            btn.title = 'Reproduzir';
        }
    }
}

// Initialize timeline when data is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for main.js to load the data
    setTimeout(() => {
        fetch('data/historia.json')
            .then(response => response.json())
            .then(data => {
                window.timeline = new Timeline('timeline', data);
                createTimelineControls();
                window.timeline.initTouchEvents();
            })
            .catch(error => {
                console.error('Error loading timeline data:', error);
            });
    }, 500);
});

