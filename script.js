// Configuration globale
const CONFIG = {
    currentStep: 1,
    maxFormStep: 5,
    selections: {
        choice: null,
        baseType: null,
        subType: null,
        explanation: null,
        propsCount: null,
        peopleCount: 2,
        rights: null,
        budget: 1000000,
        coordinates: null
    },
    elements: {
        steps: document.querySelectorAll('.step-container'),
        formSteps: document.querySelectorAll('.form-step'),
        progressFill: document.getElementById('progress-fill'),
        progressSteps: document.querySelectorAll('.progress-step'),
        prevBtn: document.getElementById('prev-step'),
        nextBtn: document.getElementById('next-step'),
        mapMarker: document.getElementById('map-marker')
    }
};

// Utilitaires
const Utils = {
    hideAll: (elements) => elements.forEach(el => el.classList.add('hidden')),
    showElement: (element) => element.classList.remove('hidden'),
    hideElement: (element) => element.classList.add('hidden'),
    
    animateElement: (element, animation = 'fadeInUp') => {
        element.style.animation = `${animation} 0.5s cubic-bezier(0.4, 0, 0.2, 1)`;
        setTimeout(() => element.style.animation = '', 500);
    },

    updateProgress: (step) => {
        const percentage = (step / CONFIG.maxFormStep) * 100;
        CONFIG.elements.progressFill.style.width = `${percentage}%`;
        
        CONFIG.elements.progressSteps.forEach((stepEl, index) => {
            if (index + 1 <= step) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });
    }
};

// Gestionnaire principal
class KuruganeApp {
    constructor() {
        this.init();
        this.bindEvents();
    }

    init() {
        // Animation d'entrée
        setTimeout(() => {
            document.querySelector('.step-container:not(.hidden)').style.opacity = '1';
        }, 100);
    }

    bindEvents() {
        // Choix initial (Créer vs Commander)
        document.querySelectorAll('.choice-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleChoiceSelection(e));
        });

        // Sélection des options dans les formulaires
        document.querySelectorAll('.option-card, .props-choice-card, .option-rights-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleOptionSelection(e));
        });

        // Sélection des sous-options
        document.querySelectorAll('.sub-option-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleSubOptionSelection(e));
        });

        // Navigation du formulaire
        CONFIG.elements.prevBtn.addEventListener('click', () => this.navigateForm('prev'));
        CONFIG.elements.nextBtn.addEventListener('click', () => this.navigateForm('next'));

        // Gestion des sliders
        this.initSliders();

        // Carte interactive
        this.initMap();

        // Finalisation
        document.getElementById('submit-order')?.addEventListener('click', () => this.submitOrder());
        document.getElementById('back-to-config')?.addEventListener('click', () => this.goToStep(2));

        // Navigation mobile
        this.initMobileNav();
    }

    handleChoiceSelection(e) {
        const card = e.currentTarget;
        const choice = card.dataset.choice;
        
        // Mise à jour visuelle
        document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // Sauvegarde et navigation
        CONFIG.selections.choice = choice;
        
        setTimeout(() => {
            if (choice === 'create') {
                this.goToStep(2);
            } else {
                // Redirection vers page de commande existante
                window.location.href = 'bases.html';
            }
        }, 500);
    }

    handleOptionSelection(e) {
        const card = e.currentTarget;
        const container = card.closest('.option-cards, .props-choices, .rights-options');
        const value = card.dataset.value;
        
        // Désélectionner les autres options dans le même groupe
        container.querySelectorAll('.option-card, .props-choice-card, .option-rights-card')
            .forEach(c => c.classList.remove('selected'));
        
        // Sélectionner la carte actuelle
        card.classList.add('selected');
        
        // Sauvegarder la sélection
        if (container.classList.contains('option-cards')) {
            CONFIG.selections.baseType = value;
            
            // Afficher les sous-options pour "Autre"
            const subSelection = document.getElementById('autre-type-subselection');
            if (value === 'Autre') {
                Utils.showElement(subSelection);
                Utils.animateElement(subSelection);
            } else {
                Utils.hideElement(subSelection);
                CONFIG.selections.subType = null;
                CONFIG.selections.explanation = null;
            }
        } else if (container.classList.contains('props-choices')) {
            CONFIG.selections.propsCount = value;
            
            // Afficher/masquer le slider de personnes selon la sélection
            const peopleSliderContainer = document.getElementById('people-slider-container');
            if (value === '+130') {
                Utils.showElement(peopleSliderContainer);
                Utils.animateElement(peopleSliderContainer);
            } else {
                Utils.hideElement(peopleSliderContainer);
                // Réinitialiser la sélection de personnes si on change d'option
                CONFIG.selections.peopleCount = 2;
                const peopleDisplay = document.getElementById('people-display');
                if (peopleDisplay) {
                    peopleDisplay.textContent = '2';
                }
                const peopleSlider = document.getElementById('people-slider');
                if (peopleSlider) {
                    peopleSlider.value = 2;
                }
            }
        } else if (container.classList.contains('rights-options')) {
            CONFIG.selections.rights = value;
        }
        
        // Animation de feedback
        this.showSelectionFeedback(card);
        
        // Mettre à jour l'état du bouton suivant
        this.updateNextButtonState();
    }

    handleSubOptionSelection(e) {
        const card = e.currentTarget;
        const value = card.dataset.value;
        
        // Désélectionner les autres sous-options
        document.querySelectorAll('.sub-option-card').forEach(c => c.classList.remove('selected'));
        
        // Sélectionner la carte actuelle
        card.classList.add('selected');
        
        // Sauvegarder la sélection
        CONFIG.selections.subType = value;
        
        // Afficher le champ d'explication
        const explicField = document.getElementById('explication-field');
        Utils.showElement(explicField);
        Utils.animateElement(explicField);
        
        // Animation de feedback
        this.showSelectionFeedback(card);
    }

    showSelectionFeedback(element) {
        const icon = element.querySelector('.option-icon, .props-choice-icon, .rights-icon, .sub-option-icon');
        if (icon) {
            icon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                icon.style.transform = 'scale(1)';
            }, 200);
        }
    }

    initSliders() {
        // Slider pour le nombre de personnes (props >130)
        const peopleSlider = document.getElementById('people-slider');
        const peopleDisplay = document.getElementById('people-display');
        
        if (peopleSlider && peopleDisplay) {
            peopleSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                CONFIG.selections.peopleCount = value;
                peopleDisplay.textContent = value;
            });
        }
        
        // Slider pour le budget
        const budgetSlider = document.getElementById('budget-slider');
        const budgetDisplay = document.getElementById('budget-display');
        
        if (budgetSlider && budgetDisplay) {
            const budgetValues = [
                1000000, 2000000, 5000000, 10000000, 15000000, 
                20000000, 25000000, 30000000
            ];
            
            const formatMoney = (amount) => {
                return new Intl.NumberFormat('fr-FR').format(amount) + ' $';
            };
            
            budgetSlider.addEventListener('input', (e) => {
                const index = parseInt(e.target.value) - 1;
                const value = budgetValues[Math.min(index, budgetValues.length - 1)];
                CONFIG.selections.budget = value;
                budgetDisplay.textContent = formatMoney(value);
            });
            
            // Initialiser l'affichage
            CONFIG.selections.budget = budgetValues[0];
            budgetDisplay.textContent = formatMoney(budgetValues[0]);
        }
    }

    updateNextButtonState() {
        // Cette fonction peut être utilisée pour activer/désactiver le bouton suivant
        // en fonction des sélections actuelles
    }

    navigateForm(direction) {
        if (direction === 'next' && CONFIG.currentStep < CONFIG.maxFormStep) {
            if (this.validateCurrentStep()) {
                CONFIG.currentStep++;
                this.updateFormDisplay();
            }
        } else if (direction === 'prev' && CONFIG.currentStep > 1) {
            CONFIG.currentStep--;
            this.updateFormDisplay();
        }
    }

    validateCurrentStep() {
        switch (CONFIG.currentStep) {
            case 1:
                if (!CONFIG.selections.baseType) {
                    this.showNotification('Veuillez sélectionner un type de base', 'warning');
                    return false;
                }
                if (CONFIG.selections.baseType === 'Autre' && !CONFIG.selections.subType) {
                    this.showNotification('Veuillez sélectionner un sous-type pour "Autre"', 'warning');
                    return false;
                }
                // Sauvegarder l'explication si nécessaire
                const explanation = document.getElementById('explication-text')?.value;
                if (explanation) {
                    CONFIG.selections.explanation = explanation;
                }
                break;
            case 2:
                if (!CONFIG.selections.propsCount) {
                    this.showNotification('Veuillez sélectionner le nombre de props', 'warning');
                    return false;
                }
                // Sauvegarder le nombre de personnes si nécessaire
                if (CONFIG.selections.propsCount === '+130') {
                    const peopleSlider = document.getElementById('people-slider');
                    if (peopleSlider) {
                        CONFIG.selections.peopleCount = parseInt(peopleSlider.value);
                    }
                }
                break;
            case 3:
                if (!CONFIG.selections.rights) {
                    this.showNotification('Veuillez sélectionner une option de droits', 'warning');
                    return false;
                }
                break;
            case 4:
                // Le budget est automatiquement sauvegardé via le slider
                break;
            case 5:
                // Les coordonnées sont optionnelles
                break;
        }
        return true;
    }

    updateFormDisplay() {
        // Masquer toutes les étapes du formulaire
        CONFIG.elements.formSteps.forEach(step => step.classList.remove('active'));
        
        // Afficher l'étape actuelle
        const currentFormStep = document.getElementById(`form-step-${CONFIG.currentStep}`);
        if (currentFormStep) {
            currentFormStep.classList.add('active');
            Utils.animateElement(currentFormStep);
        }
        
        // Mettre à jour la barre de progression
        Utils.updateProgress(CONFIG.currentStep);
        
        // Mettre à jour les boutons de navigation
        CONFIG.elements.prevBtn.disabled = CONFIG.currentStep === 1;
        CONFIG.elements.nextBtn.textContent = CONFIG.currentStep === CONFIG.maxFormStep ? 'Finaliser' : 'Suivant';
        
        // Si dernière étape, aller au résumé
        if (CONFIG.currentStep === CONFIG.maxFormStep && CONFIG.elements.nextBtn.textContent === 'Finaliser') {
            CONFIG.elements.nextBtn.onclick = () => this.goToSummary();
        }
    }

    goToStep(stepNumber) {
        Utils.hideAll(CONFIG.elements.steps);
        Utils.showElement(document.getElementById(`step-${stepNumber}`));
        
        if (stepNumber === 2) {
            CONFIG.currentStep = 1;
            this.updateFormDisplay();
        }
        
        Utils.animateElement(document.getElementById(`step-${stepNumber}`));
    }

    goToSummary() {
        if (this.validateCurrentStep()) {
            this.generateSummary();
            this.goToStep(3);
        }
    }

    generateSummary() {
        const summaryItems = document.getElementById('summary-items');
        if (!summaryItems) return;
        
        let summaryHTML = '<div class="summary-list">';
        
        if (CONFIG.selections.baseType) {
            let baseTypeDisplay = CONFIG.selections.baseType;
            if (CONFIG.selections.baseType === 'Autre' && CONFIG.selections.subType) {
                baseTypeDisplay += ` - ${CONFIG.selections.subType}`;
            }
            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-label">Type de base</div>
                    <div class="summary-value">${baseTypeDisplay}</div>
                </div>
            `;
        }
        
        if (CONFIG.selections.explanation) {
            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-label">Description</div>
                    <div class="summary-value">${CONFIG.selections.explanation}</div>
                </div>
            `;
        }
        
        if (CONFIG.selections.propsCount) {
            let propsDisplay = `${CONFIG.selections.propsCount} props`;
            if (CONFIG.selections.propsCount === '+130' && CONFIG.selections.peopleCount) {
                propsDisplay += ` (${CONFIG.selections.peopleCount} personnes pour poser)`;
            }
            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-label">Nombre de props</div>
                    <div class="summary-value">${propsDisplay}</div>
                </div>
            `;
        }
        
        if (CONFIG.selections.rights) {
            const rightsLabels = {
                'copie-revente': 'Copie & Revente',
                'exclusivite-copie': 'Exclusivité (copie conservée)',
                'exclusivite-supprime': 'Exclusivité totale'
            };
            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-label">Droits</div>
                    <div class="summary-value">${rightsLabels[CONFIG.selections.rights]}</div>
                </div>
            `;
        }
        
        if (CONFIG.selections.budget) {
            const formatMoney = (amount) => {
                return new Intl.NumberFormat('fr-FR').format(amount) + ' $';
            };
            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-label">Budget</div>
                    <div class="summary-value">${formatMoney(CONFIG.selections.budget)}</div>
                </div>
            `;
        }
        
        if (CONFIG.selections.coordinates) {
            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-label">Coordonnées</div>
                    <div class="summary-value">${CONFIG.selections.coordinates}</div>
                </div>
            `;
        }
        
        summaryHTML += '</div>';
        summaryItems.innerHTML = summaryHTML;
    }

    initMap() {
        const carte = document.getElementById('carte');
        const coordsDisplay = document.getElementById('coords');
        const anywhereBtn = document.getElementById('anywhere-btn');
        const mapMarker = CONFIG.elements.mapMarker;
        
        if (!carte || !mapMarker) return;
        
        let isDragging = false;
        let startX, startY;
        
        // Click pour placer un marqueur
        carte.addEventListener('click', (e) => {
            if (isDragging) return;
            
            const rect = carte.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.placeMarker(x, y, rect);
        });
        
        // Drag and drop du marqueur
        mapMarker.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - mapMarker.offsetLeft;
            startY = e.clientY - mapMarker.offsetTop;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const rect = carte.getBoundingClientRect();
            const x = e.clientX - rect.left - startX + 10;
            const y = e.clientY - rect.top - startY + 10;
            
            // Contraindre dans les limites de la carte
            const constrainedX = Math.max(0, Math.min(x, rect.width));
            const constrainedY = Math.max(0, Math.min(y, rect.height));
            
            this.updateMarkerPosition(constrainedX, constrainedY, rect);
        };
        
        const handleMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        // Bouton "Où vous voulez"
        if (anywhereBtn) {
            anywhereBtn.addEventListener('click', () => {
                CONFIG.selections.coordinates = 'Libre choix';
                coordsDisplay.textContent = 'Coordonnées : Libre choix';
                Utils.hideElement(mapMarker);
            });
        }
    }

    placeMarker(x, y, rect) {
        const mapMarker = CONFIG.elements.mapMarker;
        
        this.updateMarkerPosition(x, y, rect);
        
        // Afficher le marqueur avec animation
        Utils.showElement(mapMarker);
        mapMarker.style.animation = 'markerPulse 1s ease-out';
        setTimeout(() => mapMarker.style.animation = '', 1000);
    }

    updateMarkerPosition(x, y, rect) {
        const mapMarker = CONFIG.elements.mapMarker;
        const coordsDisplay = document.getElementById('coords');
        
        const percentX = Math.round((x / rect.width) * 100);
        const percentY = Math.round((y / rect.height) * 100);
        
        mapMarker.style.left = `${x}px`;
        mapMarker.style.top = `${y}px`;
        
        CONFIG.selections.coordinates = `${percentX}%, ${percentY}%`;
        coordsDisplay.textContent = `Coordonnées : ${percentX}%, ${percentY}%`;
    }

    submitOrder() {
        const name = document.getElementById('contact-name')?.value;
        const discord = document.getElementById('contact-discord')?.value;
        
        if (!name || !discord) {
            this.showNotification('Veuillez remplir les champs obligatoires', 'error');
            return;
        }
        
        // Simulation d'envoi
        this.showNotification('Envoi en cours...', 'info');
        
        setTimeout(() => {
            this.goToStep(4);
            document.getElementById('final-summary').innerHTML = 
                document.getElementById('summary-items').innerHTML;
        }, 2000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
        `;
        
        if (type === 'error') {
            notification.style.borderLeftColor = '#EF4444';
            notification.style.borderLeftWidth = '4px';
            notification.style.color = '#DC2626';
        } else if (type === 'warning') {
            notification.style.borderLeftColor = '#F59E0B';
            notification.style.borderLeftWidth = '4px';
            notification.style.color = '#D97706';
        } else if (type === 'info') {
            notification.style.borderLeftColor = '#3B82F6';
            notification.style.borderLeftWidth = '4px';
            notification.style.color = '#2563EB';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    initMobileNav() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            
            // Fermer le menu en cliquant sur un lien
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }
}

// Styles CSS pour les notifications
const notificationStyles = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes markerPulse {
        0% {
            transform: scale(0.8);
            opacity: 0.8;
        }
        50% {
            transform: scale(1.2);
            opacity: 1;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

// Injection des styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new KuruganeApp();
});

// Effets visuels avancés
document.addEventListener('DOMContentLoaded', () => {
    // Effet de parallaxe subtil
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.command-header');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

    // Animation d'apparition progressive des éléments
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer tous les éléments avec animation
    const animatedElements = document.querySelectorAll('.choice-card, .option-card, .props-choice-card, .option-rights-card, .summary-card, .contact-form');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(el);
    });

    // Effet de ripple sur les boutons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Animation CSS pour l'effet ripple
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
});

// Gestion des touches clavier pour l'accessibilité
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Fermer le menu mobile si ouvert
        const hamburger = document.querySelector('.hamburger.active');
        const navMenu = document.querySelector('.nav-menu.active');
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// Export de la classe pour utilisation externe si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KuruganeApp;
}