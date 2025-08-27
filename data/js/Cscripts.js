const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1410191180477501462/WTAKXCSzf6S185u_jw6juvwAdgdBB0FfLQoNYxUnbBQCAI_X6DNy3zCfQXekDjLmZW0U';

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

async function sendToDiscordWebhook(data) {
    const embed = {
        title: "🏗️ Nouvelle Commande Kurugane Bases",
        color: 0x00ff88,
        timestamp: new Date().toISOString(),
        thumbnail: {
            url: "https://media.discordapp.net/attachments/1342796570319519804/1409503458201047070/image.png?ex=68af9823&is=68ae46a3&hm=5c20f86fdeb28c245373a1e49b529d197bf944348458836b81fa6201a2e26212&=&format=webp&quality=lossless"
        },
        fields: []
    };

    embed.fields.push({
        name: "📋 Type de Commande",
        value: data.choice === 'create' ? '🎨 **Création personnalisée**' : '🛒 **Commande base existante**',
        inline: true
    });

    embed.fields.push({
        name: "🏠 Type de Base",
        value: `${getIconForBaseType(data.baseType)} **${data.baseType}**${data.subType ? ` (${data.subType})` : ''}`,
        inline: true
    });

    embed.fields.push({
        name: "🧱 Nombre de Props",
        value: `**${data.props}** props`,
        inline: true
    });

    if (data.people && data.people > 1) {
        embed.fields.push({
            name: "👥 Équipe Construction",
            value: `**${data.people}** personne${data.people > 1 ? 's' : ''}`,
            inline: true
        });
    }

    if (data.budget) {
        embed.fields.push({
            name: "💰 Budget Client",
            value: `**${formatMoney(data.budget)}**`,
            inline: true
        });
    }

    if (data.rights) {
        embed.fields.push({
            name: "⚖️ Type de Licence",
            value: `**${getRightsLabel(data.rights)}**`,
            inline: true
        });
    }

    if (data.coordinates && !data.coordinates.includes('Cliquez')) {
        embed.fields.push({
            name: "📍 Localisation Demandée",
            value: `\`${data.coordinates.replace('Coordonnées : ', '')}\``,
            inline: false
        });
    }

    if (data.explication && data.explication.trim()) {
        embed.fields.push({
            name: "📝 Description du Client",
            value: data.explication.length > 800 ? 
                `${data.explication.substring(0, 800)}...` : 
                data.explication,
            inline: false
        });
    }

    embed.fields.push({
        name: "\u200B",
        value: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        inline: false
    });

    let contactText = `👤 **${data.contactName}**\n💬 ${data.contactDiscord}`;
    if (data.contactEmail && data.contactEmail.trim()) {
        contactText += `\n📧 ${data.contactEmail}`;
    }
    
    embed.fields.push({
        name: "📞 Informations de Contact",
        value: contactText,
        inline: false
    });

    if (data.contactMessage && data.contactMessage.trim()) {
        embed.fields.push({
            name: "💬 Message Supplémentaire",
            value: data.contactMessage.length > 500 ? 
                `${data.contactMessage.substring(0, 500)}...` : 
                data.contactMessage,
            inline: false
        });
    }
    embed.footer = {
        text: `Commande reçue le ${new Date().toLocaleString('fr-FR')} • Kurugane Bases`,
        icon_url: "https://media.discordapp.net/attachments/1342796570319519804/1409503458201047070/image.png?ex=68af9823&is=68ae46a3&hm=5c20f86fdeb28c245373a1e49b529d197bf944348458836b81fa6201a2e26212&=&format=webp&quality=lossless"
    };

    const payload = {
        username: "🤖 Kurugane Assistant",
        avatar_url: "https://media.discordapp.net/attachments/1342796570319519804/1409503458201047070/image.png?ex=68af9823&is=68ae46a3&hm=5c20f86fdeb28c245373a1e49b529d197bf944348458836b81fa6201a2e26212&=&format=webp&quality=lossless",
        content: `🔔 **Nouvelle commande reçue !** <@&1362120827784659186>`,
        embeds: [embed]
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur Discord ${response.status}: ${errorText}`);
        }

        return { success: true };

    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

function getIconForBaseType(type) {
    const icons = {
        'PO': '🛡️',
        'Farm': '🌱', 
        'RP': '🎭',
        'EVENT': '🎉',
        'CASINO': '🎰',
        'Autre': '🏠'
    };
    return icons[type] || '🏗️';
}

function getRightsLabel(rights) {
    const labels = {
        'copie-revente': '📋 Copie & Revente (Standard)',
        'exclusivite-copie': '👑 Exclusivité avec copie (+500k$)', 
        'exclusivite-supprime': '🔒 Exclusivité totale (+1M$)'
    };
    return labels[rights] || rights;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' $';
}

function collectFormData() {
    const selectedChoice = document.querySelector('.choice-card.selected');
    CONFIG.selections.choice = selectedChoice?.dataset.choice || '';

    const selectedBase = document.querySelector('.option-card.selected');
    CONFIG.selections.baseType = selectedBase?.dataset.value || '';
    
    const selectedSubType = document.querySelector('.sub-option-card.selected');
    CONFIG.selections.subType = selectedSubType?.dataset.value || '';
    
    CONFIG.selections.explanation = document.getElementById('explication-text')?.value || '';

    const selectedProps = document.querySelector('.props-choice-card.selected');
    CONFIG.selections.propsCount = selectedProps?.dataset.value || '';
    
    const peopleSlider = document.getElementById('people-slider');
    CONFIG.selections.peopleCount = peopleSlider ? parseInt(peopleSlider.value) : 2;

    const selectedRights = document.querySelector('.option-rights-card.selected');
    CONFIG.selections.rights = selectedRights?.dataset.value || '';

    const coordsElement = document.getElementById('coords');
    CONFIG.selections.coordinates = coordsElement?.textContent || '';

    return {
        choice: CONFIG.selections.choice,
        baseType: CONFIG.selections.baseType,
        subType: CONFIG.selections.subType,
        explication: CONFIG.selections.explanation,
        props: CONFIG.selections.propsCount,
        people: CONFIG.selections.peopleCount,
        rights: CONFIG.selections.rights,
        budget: CONFIG.selections.budget,
        coordinates: CONFIG.selections.coordinates,
        contactName: document.getElementById('contact-name')?.value.trim() || '',
        contactEmail: document.getElementById('contact-email')?.value.trim() || '',
        contactDiscord: document.getElementById('contact-discord')?.value.trim() || '',
        contactMessage: document.getElementById('contact-message')?.value.trim() || ''
    };
}

function validateFormData(data) {
    const errors = [];
    
    if (!data.contactName) errors.push('Le nom IG est requis');
    if (!data.contactDiscord) errors.push('Le Discord est requis');
    if (!data.baseType) errors.push('Le type de base doit être sélectionné');
    if (!data.props) errors.push('Le nombre de props doit être sélectionné');
    
    return errors;
}

function showSuccessStep(data) {
    document.querySelectorAll('.step-container').forEach(step => {
        step.classList.add('hidden');
    });
    const successStep = document.getElementById('step-4');
    if (successStep) {
        successStep.classList.remove('hidden');
        
        const finalSummary = document.getElementById('final-summary');
        if (finalSummary) {
            finalSummary.innerHTML = generateFinalSummary(data);
        }
    }
}

function generateFinalSummary(data) {
    return `
        <div class="summary-items">
            <div class="summary-item">
                <span class="item-label">Type de base:</span>
                <span class="item-value">${data.baseType}${data.subType ? ` (${data.subType})` : ''}</span>
            </div>
            <div class="summary-item">
                <span class="item-label">Nombre de props:</span>
                <span class="item-value">${data.props}</span>
            </div>
            <div class="summary-item">
                <span class="item-label">Budget proposé:</span>
                <span class="item-value">${formatMoney(data.budget)}</span>
            </div>
            <div class="summary-item">
                <span class="item-label">Contact Discord:</span>
                <span class="item-value">${data.contactDiscord}</span>
            </div>
            <div class="summary-item">
                <span class="item-label">Référence:</span>
                <span class="item-value">#KB-${Date.now().toString().slice(-6)}</span>
            </div>
        </div>
        <div class="success-note">
            <p><strong>✅ Votre commande a été envoyée avec succès sur notre Discord !</strong></p>
            <p>Nous vous contacterons sous 24h pour discuter des détails.</p>
        </div>
    `;
}

class KuruganeApp {
    constructor() {
        this.init();
        this.bindEvents();
    }

    init() {
        setTimeout(() => {
            document.querySelector('.step-container:not(.hidden)').style.opacity = '1';
        }, 100);
    }

    bindEvents() {
        document.querySelectorAll('.choice-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleChoiceSelection(e));
        });

        document.querySelectorAll('.option-card, .props-choice-card, .option-rights-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleOptionSelection(e));
        });

        document.querySelectorAll('.sub-option-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleSubOptionSelection(e));
        });

        CONFIG.elements.prevBtn.addEventListener('click', () => this.navigateForm('prev'));
        CONFIG.elements.nextBtn.addEventListener('click', () => this.navigateForm('next'));

        this.initSliders();
        this.initMap();

        document.getElementById('back-to-config')?.addEventListener('click', () => this.goToStep(2));
        this.initMobileNav();
        this.initSubmitButton();
    }

    initSubmitButton() {
        const submitButton = document.getElementById('submit-order');
        if (submitButton) {
            submitButton.onclick = async (e) => {
                e.preventDefault();
                
                const data = collectFormData();
                const errors = validateFormData(data);
                if (errors.length > 0) {
                    this.showNotification('Erreurs :\n' + errors.join('\n'), 'error');
                    return;
                }
                
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi vers Discord...';
                
                try {
                    const result = await sendToDiscordWebhook(data);
                    
                    if (result.success) {
                        showSuccessStep(data);
                    } else {
                        throw new Error(result.error);
                    }
                    
                } catch (error) {
                    this.showNotification('Erreur lors de l\'envoi vers Discord.\nVeuillez nous contacter directement.\n\nErreur: ' + error.message, 'error');
                    
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Finaliser la Commande';
                }
            };
        }
    }

    handleChoiceSelection(e) {
        const card = e.currentTarget;
        const choice = card.dataset.choice;
        
        document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        CONFIG.selections.choice = choice;
        
        setTimeout(() => {
            if (choice === 'create') {
                this.goToStep(2);
            } else {
                window.location.href = 'bases.html';
            }
        }, 500);
    }

    handleOptionSelection(e) {
        const card = e.currentTarget;
        const container = card.closest('.option-cards, .props-choices, .rights-options');
        const value = card.dataset.value;
        
        container.querySelectorAll('.option-card, .props-choice-card, .option-rights-card')
            .forEach(c => c.classList.remove('selected'));
        
        card.classList.add('selected');
        
        if (container.classList.contains('option-cards')) {
            CONFIG.selections.baseType = value;
            
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
            
            const peopleSliderContainer = document.getElementById('people-slider-container');
            if (value === '+130') {
                Utils.showElement(peopleSliderContainer);
                Utils.animateElement(peopleSliderContainer);
            } else {
                Utils.hideElement(peopleSliderContainer);
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
        
        this.showSelectionFeedback(card);
        this.updateNextButtonState();
    }

    handleSubOptionSelection(e) {
        const card = e.currentTarget;
        const value = card.dataset.value;
        
        document.querySelectorAll('.sub-option-card').forEach(c => c.classList.remove('selected'));
        
        card.classList.add('selected');
        
        CONFIG.selections.subType = value;
        
        const explicField = document.getElementById('explication-field');
        Utils.showElement(explicField);
        Utils.animateElement(explicField);
        
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
        const peopleSlider = document.getElementById('people-slider');
        const peopleDisplay = document.getElementById('people-display');
        
        if (peopleSlider && peopleDisplay) {
            peopleSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                CONFIG.selections.peopleCount = value;
                peopleDisplay.textContent = value;
            });
        }
        
        const budgetSlider = document.getElementById('budget-slider');
        const budgetDisplay = document.getElementById('budget-display');
        
        if (budgetSlider && budgetDisplay) {
            const budgetValues = [
                1000000, 2000000, 5000000, 10000000, 15000000, 
                20000000, 25000000, 30000000
            ];
            
            budgetSlider.addEventListener('input', (e) => {
                const index = parseInt(e.target.value) - 1;
                const value = budgetValues[Math.min(index, budgetValues.length - 1)];
                CONFIG.selections.budget = value;
                budgetDisplay.textContent = formatMoney(value);
            });
            
            CONFIG.selections.budget = budgetValues[0];
            budgetDisplay.textContent = formatMoney(budgetValues[0]);
        }
    }

    updateNextButtonState() {
        
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
                break;
            case 5:
                break;
        }
        return true;
    }

    updateFormDisplay() {
        CONFIG.elements.formSteps.forEach(step => step.classList.remove('active'));
        
        const currentFormStep = document.getElementById(`form-step-${CONFIG.currentStep}`);
        if (currentFormStep) {
            currentFormStep.classList.add('active');
            Utils.animateElement(currentFormStep);
        }
        
        Utils.updateProgress(CONFIG.currentStep);
        
        CONFIG.elements.prevBtn.disabled = CONFIG.currentStep === 1;
        CONFIG.elements.nextBtn.textContent = CONFIG.currentStep === CONFIG.maxFormStep ? 'Finaliser' : 'Suivant';
        
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
        
        carte.addEventListener('click', (e) => {
            if (isDragging) return;
            
            const rect = carte.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.placeMarker(x, y, rect);
        });
        
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
            
            const constrainedX = Math.max(0, Math.min(x, rect.width));
            const constrainedY = Math.max(0, Math.min(y, rect.height));
            
            this.updateMarkerPosition(constrainedX, constrainedY, rect);
        };
        
        const handleMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
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
            
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }
}

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

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

document.addEventListener('DOMContentLoaded', () => {
    new KuruganeApp();
});

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.command-header');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

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

    const animatedElements = document.querySelectorAll('.choice-card, .option-card, .props-choice-card, .option-rights-card, .summary-card, .contact-form');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(el);
    });

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const hamburger = document.querySelector('.hamburger.active');
        const navMenu = document.querySelector('.nav-menu.active');
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = KuruganeApp;
}