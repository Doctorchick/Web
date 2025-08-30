// Script anti-inspection
(function() {
    'use strict';
    
    let detected = false;
    
    function destroyPage() {
        if (detected) return;
        detected = true;
        
        document.body.style.filter = 'blur(20px)';
        document.body.innerHTML = '';
    }
    
    // Détection par taille fenêtre
    function checkWindowSize() {
        if (window.outerHeight - window.innerHeight > 150 || 
            window.outerWidth - window.innerWidth > 150) {
            destroyPage();
        }
    }
    
    // Détection console timing
    function checkConsole() {
        let start = Date.now();
        console.log('%c', 'color: transparent');
        if (Date.now() - start > 50) {
            destroyPage();
        }
    }
    
    // Détection debugger
    setInterval(function() {
        let start = Date.now();
        debugger;
        if (Date.now() - start > 50) {
            destroyPage();
        }
    }, 1000);
    
    // Désactiver clic droit
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Désactiver raccourcis
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
            (e.ctrlKey && ['u', 'U', 's', 'S'].includes(e.key))) {
            e.preventDefault();
            destroyPage();
        }
    });
    
    // Empêcher sélection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });
    
    // Surveiller en continu
    setInterval(checkWindowSize, 500);
    setInterval(checkConsole, 1000);
    
    // Masquer erreurs
    window.addEventListener('error', function(e) {
        e.preventDefault();
        return true;
    });
    
})();