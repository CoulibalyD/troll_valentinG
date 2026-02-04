// main.js — version améliorée pour index.html (FR)
(() => {
    // Récupère / demande le prénom, sanitize et stocke
    function askName() {
        try {
            const stored = localStorage.getItem('valentine_name');
            if (stored) return stored;
        } catch (e) { /* localStorage peut être désactivé */ }

        const raw = prompt("Quel est ton prénom ? ❤️") || '';
        const name = raw.trim().replace(/\s+/g, ' ');
        const nice = name ? (name[0].toUpperCase() + name.slice(1)) : 'mon amour';
        try { localStorage.setItem('valentine_name', nice); } catch (e) {}
        return nice;
    }

    const userName = askName();
    const question = document.getElementById("question");
    if (!question) {
        console.warn('main.js: élément #question introuvable');
    } else {
        question.textContent = `Veux-tu être ma Valentine, ${userName} ?`;
    }

    const noBtn = document.getElementById("noBtn");
    const yesBtn = document.getElementById("yesBtn");

    if (!noBtn || !yesBtn) {
        console.warn('main.js: boutons #noBtn ou #yesBtn introuvables');
        return;
    }

    // Respect accessibility: si utilisateur préfère réduire les animations, on désactive la fuite
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        noBtn.setAttribute('aria-disabled', 'true');
        noBtn.title = "Animation désactivée (préférence système)";
        noBtn.style.cursor = 'not-allowed';
        noBtn.addEventListener('click', (e) => e.preventDefault());
        // on garde le flux normal — on ne fera pas fuir le bouton
        return;
    }

    // conteneur relatif (doit être position: relative). on prend parent le plus proche positionné
    const buttonsWrapper = (function findRelativeParent(el) {
        let node = el.parentElement;
        while (node) {
            const st = getComputedStyle(node);
            if (st.position !== 'static') return node;
            node = node.parentElement;
        }
        // fallback: utiliser body et positionner absolute par rapport à viewport
        document.body.style.position = document.body.style.position || 'relative';
        return document.body;
    })(noBtn);

    // compteur de tentatives (pour variant humoristique)
    let attempts = 0;

    // calcule une position valide pour le bouton "No" à l'intérieur du wrapper,
    // sans chevauchement avec le bouton "Yes"
    function computeValidPosition() {
        const wrapperRect = buttonsWrapper.getBoundingClientRect();
        const yesRect = yesBtn.getBoundingClientRect();
        const noRect = noBtn.getBoundingClientRect();

        const padding = 8; // marge intérieure
        const maxX = Math.max(0, wrapperRect.width - noRect.width - padding * 2);
        const maxY = Math.max(0, wrapperRect.height - noRect.height - padding * 2);

        // fallback si wrapper trop petit : positionner relative au viewport
        const baseLeft = wrapperRect.left;
        const baseTop = wrapperRect.top;

        // essaie de générer une position qui n'intersecte pas yesBtn
        const triesLimit = 40;
        for (let t = 0; t < triesLimit; t++) {
            const x = padding + Math.random() * maxX; // px relatif au wrapper
            const y = padding + Math.random() * maxY;

            // coordonnées absolues pour comparer
            const absLeft = baseLeft + x;
            const absTop = baseTop + y;
            const absRight = absLeft + noRect.width;
            const absBottom = absTop + noRect.height;

            const overlap = !(absRight < yesRect.left || absLeft > yesRect.right || absBottom < yesRect.top || absTop > yesRect.bottom);
            if (!overlap) {
                return { left: x, top: y };
            }
        }

        // si on n'a pas trouvé (wrapper petit), on renvoie une position random simple
        return {
            left: padding + Math.random() * Math.max(0, (wrapperRect.width - noRect.width - padding * 2)),
            top: padding + Math.random() * Math.max(0, (wrapperRect.height - noRect.height - padding * 2))
        };
    }

    // applique la position (px) au bouton (style.left/style.top)
    function moveNoButton(animate = true) {
        attempts++;
        // change le label après plusieurs tentatives — petit troll gentil
        if (attempts === 6) noBtn.textContent = "Essaye encore 😏";
        if (attempts === 12) noBtn.textContent = "Tu insistes... ❤️";
        if (attempts > 18) noBtn.textContent = "Bon d'accord :)" ;

        const pos = computeValidPosition();
        if (animate) {
            // animation douce
            noBtn.style.transition = 'left 220ms ease, top 220ms ease';
        } else {
            noBtn.style.transition = 'none';
        }

        // s'assurer que le wrapper est positionné pour que left/top aient un sens
        if (getComputedStyle(buttonsWrapper).position === 'static') {
            buttonsWrapper.style.position = 'relative';
        }

        noBtn.style.position = 'absolute';
        noBtn.style.left = `${Math.round(pos.left)}px`;
        noBtn.style.top = `${Math.round(pos.top)}px`;
    }

    // événements : mouseenter (plus fiable que mouseover) + touchstart + keyboard attempts
    function registerEvents() {
        // move on hover / enter
        noBtn.addEventListener('mouseenter', (e) => {
            // si l'utilisateur essaie de cliquer (mousedown) juste après hover, on déplace quand même
            moveNoButton(true);
        });

        // handle touch for mobile (touchstart)
        noBtn.addEventListener('touchstart', (e) => {
            // empêcher le comportement natif de click qui pourrait activer le bouton
            e.preventDefault();
            moveNoButton(false); // sans animation sur mobile pour réactivité
        }, { passive: false });

        // handle keyboard: si le bouton reçoit le focus et l'utilisateur appuie sur Enter/Space -> bouger au lieu d'activer
        noBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                moveNoButton(true);
            }
        });

        // si malgré tout on clique (rare), on le fait rebondir puis renvoyer vers oui après 700ms (optionnel)
        noBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // animation "shake" rapide
            noBtn.style.transition = 'transform 150ms ease';
            noBtn.style.transform = 'translateX(-10px)';
            setTimeout(() => { noBtn.style.transform = 'translateX(10px)'; }, 150);
            setTimeout(() => { noBtn.style.transform = 'translateX(0)'; noBtn.style.transition = ''; }, 320);

            // Option : après X clics, rediriger (ici on laisse en troll ; on ne redirige pas)
        });

        // keep yesBtn accessible by keyboard/enter
        yesBtn.addEventListener('click', () => {
            window.location.href = "celebration.html";
        });
        yesBtn.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' || e.key === ' ') yesBtn.click();
        });

        // reposition on window resize so button doesn't jump out
        window.addEventListener('resize', () => {
            // repositionne si le bouton est hors wrapper bounds
            moveNoButton(false);
        });
    }

    // initial placement : place le bouton Non à droite par défaut si possible
    // petit timeout pour que le layout soit stabilisé
    setTimeout(() => {
        moveNoButton(false);
        registerEvents();
    }, 60);

    // cleanup (optionnel) : enlever listeners si page navigue
    window.addEventListener('beforeunload', () => {
        try {
            noBtn.replaceWith(noBtn.cloneNode(true)); // supprime listeners simples
        } catch (e) {}
    });

})();
