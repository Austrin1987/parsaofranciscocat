// Gallery functionality
class GalleryManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = null;
        this.currentSection = null;
        this.currentImages = [];
        this.currentImageIndex = 0;
        this.init();
    }
    
    async init() {
        try {
            const response = await fetch('data/fotos.json');
            this.data = await response.json();
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Error loading gallery data:', error);
        }
    }
    
    render() {
        if (!this.container || !this.data) return;
        
        const sectionsHTML = Object.entries(this.data.secoes).map(([key, secao]) => `
            <div class="galeria-secao" data-section="${key}">
                <div class="galeria-secao-image">
                    <img src="${secao.thumbnail}" alt="${secao.nome}" onerror="this.src='images/galeria/placeholder.jpg'">
                    <div class="galeria-secao-overlay">
                        <div class="overlay-content">
                            <h3>${secao.nome}</h3>
                            <p class="foto-count">${secao.total_fotos} fotos</p>
                            <button class="btn btn-primary">Ver Galeria</button>
                        </div>
                    </div>
                </div>
                <div class="galeria-secao-content">
                    <h3>${secao.nome}</h3>
                    <div class="galeria-secao-count">${secao.total_fotos} fotos</div>
                    <p>${secao.descricao}</p>
                </div>
            </div>
        `).join('');
        
        this.container.innerHTML = sectionsHTML;
    }
    
    bindEvents() {
        this.container.querySelectorAll('.galeria-secao').forEach(secao => {
            secao.addEventListener('click', () => {
                const sectionKey = secao.dataset.section;
                this.openSection(sectionKey);
            });
        });
        
        // Keyboard navigation for lightbox
        document.addEventListener('keydown', (e) => {
            if (this.isLightboxOpen()) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousImage();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextImage();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.closeLightbox();
                        break;
                }
            }
        });
    }
    
    openSection(sectionKey) {
        const secao = this.data.secoes[sectionKey];
        if (!secao) return;
        
        this.currentSection = sectionKey;
        
        const modalContent = document.getElementById('foto-modal-content');
        if (!modalContent) return;
        
        let subgaleriasHTML = '';
        if (secao.subgalerias && secao.subgalerias.length > 0) {
            subgaleriasHTML = secao.subgalerias.map((sub, subIndex) => `
                <div class="subgaleria" data-subgaleria="${subIndex}">
                    <h4>${sub.nome}</h4>
                    <div class="image-grid">
                        ${sub.fotos.map((foto, fotoIndex) => `
                            <div class="image-item" data-image-index="${fotoIndex}" data-subgaleria="${subIndex}">
                                <img src="${secao.pasta}${foto}" alt="${sub.nome}" 
                                     onerror="this.src='images/galeria/placeholder.jpg'"
                                     loading="lazy">
                                <div class="image-overlay">
                                    <div class="overlay-content">
                                        <span class="view-icon">🔍</span>
                                        <span class="view-text">Ver imagem</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        modalContent.innerHTML = `
            <div class="gallery-modal-content">
                <div class="gallery-header">
                    <h3>${secao.nome}</h3>
                    <p>${secao.descricao}</p>
                    <div class="gallery-stats">
                        <span class="total-photos">${secao.total_fotos} fotos</span>
                        <div class="gallery-actions">
                            <button class="btn btn-secondary" onclick="galleryManager.downloadSection('${sectionKey}')">
                                📥 Baixar Todas
                            </button>
                            <button class="btn btn-secondary" onclick="galleryManager.shareSection('${sectionKey}')">
                                📤 Compartilhar
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="gallery-content">
                    ${subgaleriasHTML}
                </div>
            </div>
        `;
        
        // Bind image click events
        modalContent.querySelectorAll('.image-item').forEach(item => {
            item.addEventListener('click', () => {
                const subgaleriaIndex = parseInt(item.dataset.subgaleria);
                const imageIndex = parseInt(item.dataset.imageIndex);
                this.openLightbox(subgaleriaIndex, imageIndex);
            });
        });
        
        openModal('foto-modal');
    }
    
    openLightbox(subgaleriaIndex, imageIndex) {
        const secao = this.data.secoes[this.currentSection];
        if (!secao || !secao.subgalerias[subgaleriaIndex]) return;

        const fotoModal = document.getElementById('foto-modal');
        if (fotoModal) {
            closeModal(fotoModal); // Usa a função global de main.js
        }
        
        const subgaleria = secao.subgalerias[subgaleriaIndex];
        this.currentImages = subgaleria.fotos.map(foto => ({
            src: secao.pasta + foto,
            alt: subgaleria.nome,
            caption: `${subgaleria.nome} - ${secao.nome}`
        }));
        
        this.currentImageIndex = imageIndex;
        this.showLightbox();
    }
    
    showLightbox() {
        if (this.currentImages.length === 0) return;
        
        const currentImage = this.currentImages[this.currentImageIndex];
        
        // Create or update lightbox
        let lightbox = document.getElementById('lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.className = 'lightbox';
            document.body.appendChild(lightbox);
        }
        
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <div class="lightbox-header">
                    <div class="lightbox-info">
                        <span class="image-counter">${this.currentImageIndex + 1} de ${this.currentImages.length}</span>
                        <span class="image-caption">${currentImage.caption}</span>
                    </div>
                    <button class="lightbox-close" onclick="galleryManager.closeLightbox()">×</button>
                </div>
                
                <div class="lightbox-body">
                    <button class="lightbox-nav lightbox-prev" onclick="galleryManager.previousImage()" 
                            ${this.currentImageIndex === 0 ? 'disabled' : ''}>
                        ‹
                    </button>
                    
                    <div class="lightbox-image-container">
                        <img src="${currentImage.src}" alt="${currentImage.alt}" class="lightbox-image">
                        <div class="lightbox-loading">Carregando...</div>
                    </div>
                    
                    <button class="lightbox-nav lightbox-next" onclick="galleryManager.nextImage()"
                            ${this.currentImageIndex === this.currentImages.length - 1 ? 'disabled' : ''}>
                        ›
                    </button>
                </div>
                
                <div class="lightbox-footer">
                    <div class="lightbox-actions">
                        <button class="btn btn-secondary" onclick="galleryManager.downloadCurrentImage()">
                            📥 Baixar
                        </button>
                        <button class="btn btn-secondary" onclick="galleryManager.shareCurrentImage()">
                            📤 Compartilhar
                        </button>
                        <button class="btn btn-secondary" onclick="galleryManager.toggleFullscreen()">
                            ⛶ Tela Cheia
                        </button>
                    </div>
                    
                    <div class="lightbox-thumbnails">
                        ${this.generateThumbnails()}
                    </div>
                </div>
            </div>
        `;
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Handle image loading
        const img = lightbox.querySelector('.lightbox-image');
        const loading = lightbox.querySelector('.lightbox-loading');
        
        img.onload = () => {
            loading.style.display = 'none';
            img.style.opacity = '1';
        };
        
        img.onerror = () => {
            loading.textContent = 'Erro ao carregar imagem';
        };
        
        // Touch/swipe support
        this.initTouchEvents(lightbox);
    }
    
    generateThumbnails() {
        return this.currentImages.map((image, index) => `
            <div class="thumbnail ${index === this.currentImageIndex ? 'active' : ''}" 
                 onclick="galleryManager.goToImage(${index})">
                <img src="${image.src}" alt="${image.alt}" loading="lazy">
            </div>
        `).join('');
    }
    
    nextImage() {
        if (this.currentImageIndex < this.currentImages.length - 1) {
            this.currentImageIndex++;
            this.updateLightbox();
        }
    }
    
    previousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.updateLightbox();
        }
    }
    
    goToImage(index) {
        if (index >= 0 && index < this.currentImages.length) {
            this.currentImageIndex = index;
            this.updateLightbox();
        }
    }
    
    updateLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;
        
        const currentImage = this.currentImages[this.currentImageIndex];
        
        // Update image
        const img = lightbox.querySelector('.lightbox-image');
        const loading = lightbox.querySelector('.lightbox-loading');
        
        img.style.opacity = '0';
        loading.style.display = 'block';
        
        setTimeout(() => {
            img.src = currentImage.src;
            img.alt = currentImage.alt;
        }, 150);
        
        // Update counter and caption
        lightbox.querySelector('.image-counter').textContent = 
            `${this.currentImageIndex + 1} de ${this.currentImages.length}`;
        lightbox.querySelector('.image-caption').textContent = currentImage.caption;
        
        // Update navigation buttons
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        
        prevBtn.disabled = this.currentImageIndex === 0;
        nextBtn.disabled = this.currentImageIndex === this.currentImages.length - 1;
        
        // Update thumbnails
        lightbox.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentImageIndex);
        });
    }
    
    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';

            setTimeout(() => {
                if (lightbox) {
                    lightbox.remove();
                }
            }, 300);
        }
    }
    
    isLightboxOpen() {
        const lightbox = document.getElementById('lightbox');
        return lightbox && lightbox.classList.contains('active');
    }
    
    initTouchEvents(lightbox) {
        let startX = 0;
        let startY = 0;
        
        lightbox.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        lightbox.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousImage();
                } else {
                    this.nextImage();
                }
            }
            // Vertical swipe down to close
            else if (deltaY > 100) {
                this.closeLightbox();
            }
        });
    }
    
    downloadCurrentImage() {
        if (this.currentImages.length === 0) return;
        
        const currentImage = this.currentImages[this.currentImageIndex];
        const link = document.createElement('a');
        link.href = currentImage.src;
        link.download = `${currentImage.caption.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
        link.click();
    }
    
    shareCurrentImage() {
        if (this.currentImages.length === 0) return;
        
        const currentImage = this.currentImages[this.currentImageIndex];
        const shareData = {
            title: currentImage.caption,
            text: `Confira esta foto: ${currentImage.caption}`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`)
                .then(() => {
                    alert('Link da imagem copiado para a área de transferência!');
                });
        }
    }
    
    downloadSection(sectionKey) {
        const secao = this.data.secoes[sectionKey];
        if (!secao) return;
        
        // Create a zip file with all images (simplified implementation)
        alert(`Funcionalidade de download em desenvolvimento. Seção: ${secao.nome}`);
    }
    
    shareSection(sectionKey) {
        const secao = this.data.secoes[sectionKey];
        if (!secao) return;
        
        const shareData = {
            title: `Galeria: ${secao.nome}`,
            text: `Confira nossa galeria de fotos: ${secao.nome} - ${secao.total_fotos} fotos`,
            url: `${window.location.origin}${window.location.pathname}#fotos`
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
                .then(() => {
                    alert('Link da galeria copiado para a área de transferência!');
                });
        }
    }
    
    toggleFullscreen() {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;
        
        if (!document.fullscreenElement) {
            lightbox.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // Lazy loading for better performance
    initLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Create gallery filters
function createGalleryFilters() {
    const filtersHTML = `
        <div class="gallery-filters">
            <div class="filter-row">
                <div class="view-options">
                    <button class="btn btn-secondary active" onclick="setGalleryView('grid')" id="grid-view">
                        ⊞ Grade
                    </button>
                    <button class="btn btn-secondary" onclick="setGalleryView('list')" id="list-view">
                        ☰ Lista
                    </button>
                </div>
                
                <div class="sort-options">
                    <select id="gallery-sort" onchange="sortGallery(this.value)">
                        <option value="name">Ordenar por Nome</option>
                        <option value="photos">Ordenar por Quantidade</option>
                        <option value="recent">Mais Recentes</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    const fotosSection = document.getElementById('fotos');
    if (fotosSection) {
        const sectionHeader = fotosSection.querySelector('.section-header');
        sectionHeader.insertAdjacentHTML('afterend', filtersHTML);
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        // Apenas restaura o overflow se nenhum outro modal estiver ativo
        if (!document.querySelector('.modal.active')) {
            document.body.style.overflow = '';
        }
    }
}

function setGalleryView(view) {
    const gridBtn = document.getElementById('grid-view');
    const listBtn = document.getElementById('list-view');
    const gallery = document.getElementById('galeria-grid');
    
    if (view === 'grid') {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        gallery.classList.remove('list-view');
    } else {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        gallery.classList.add('list-view');
    }
}

function sortGallery(sortBy) {
    // Implementation for sorting gallery sections
    console.log('Sorting gallery by:', sortBy);
}

// Initialize gallery manager
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.galleryManager = new GalleryManager('galeria-grid');
        createGalleryFilters();
    }, 500);
});

