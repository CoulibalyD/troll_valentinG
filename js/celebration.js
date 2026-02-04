// celebration.js — combine confetti + fireworks + hearts (version améliorée)
(() => {
    // éléments DOM
    const canvas = document.getElementById('fxCanvas');
    if (!canvas) {
        console.warn('celebration.js: canvas #fxCanvas introuvable');
        return;
    }
    const ctx = canvas.getContext('2d');

    // hearts container : fallback creation si absent
    let heartsContainer = document.getElementById('hearts');
    if (!heartsContainer) {
        heartsContainer = document.createElement('div');
        heartsContainer.id = 'hearts';
        // style minimal pour s'assurer que c'est au-dessus
        heartsContainer.style.position = 'fixed';
        heartsContainer.style.inset = '0';
        heartsContainer.style.pointerEvents = 'none';
        heartsContainer.style.zIndex = '10';
        document.body.appendChild(heartsContainer);
    }

    // état
    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let particles = [];
    let rockets = [];
    let running = true;

    // timers
    let rocketTimer = null;
    let confettiTimer = null;
    let heartTimer = null;

    // adaptivité / perf
    const isMobile = () => window.innerWidth <= 420;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MAX_PARTICLES = () => isMobile() ? 300 : 1200;

    // utilitaires
    const rand = (a, b) => Math.random() * (b - a) + a;
    const COLORS = ['#ff4e50', '#ff7a8a', '#ffd166', '#f9d423', '#7ee7c7', '#b39ddb'];

    // --- canvas DPI / resize handling ---
    function resizeCanvas() {
        W = window.innerWidth;
        H = window.innerHeight;
        dpr = Math.max(1, window.devicePixelRatio || 1);

        // style size (CSS px)
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';

        // actual pixels
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);

        // scale drawing ops so coordinates are in CSS pixels
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    resizeCanvas();

    // --- classes ---
    class Confetti {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.w = rand(6, 12); this.h = rand(8, 18);
            this.color = COLORS[(Math.random() * COLORS.length) | 0];
            this.vx = rand(-3, 3);
            this.vy = rand(-8, -2);
            this.rot = rand(0, Math.PI * 2);
            this.vr = rand(-0.12, 0.12);
            this.gravity = 0.26;
            this.drag = 0.995;
            this.age = 0;
            this.life = 160 + (Math.random() * 80 | 0);
        }
        update() {
            this.vx *= this.drag;
            this.vy += this.gravity;
            this.x += this.vx; this.y += this.vy;
            this.rot += this.vr;
            this.age++;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            ctx.restore();
        }
    }

    class Rocket {
        constructor(x) {
            this.x = x; this.y = H + 10;
            this.vx = rand(-1, 1);
            this.vy = rand(-10, -13);
            this.targetY = rand(H * 0.2, H * 0.45);
            this.exploded = false;
            this.color = COLORS[(Math.random() * COLORS.length) | 0];
            this.age = 0;
            this.life = 200;
        }
        update() {
            this.vy += 0.2; // gravity
            this.x += this.vx; this.y += this.vy;
            this.age++;
            if (this.y <= this.targetY && !this.exploded) {
                this.explode();
                this.exploded = true;
            }
            // safety: if it lives too long, explode anyway
            if (this.age > this.life && !this.exploded) {
                this.explode();
                this.exploded = true;
            }
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2.4, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        explode() {
            const n = 24 + ((Math.random() * 28) | 0);
            for (let i = 0; i < n; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rand(1.6, 6);
                particles.push(new ExplosionParticle(
                    this.x, this.y,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    this.color
                ));
            }
            // confetti inside explosion (fewer on mobile)
            const confCount = isMobile() ? 6 : 14;
            for (let i = 0; i < confCount; i++) {
                particles.push(new Confetti(this.x + rand(-8, 8), this.y + rand(-8, 8)));
            }
        }
    }

    class ExplosionParticle {
        constructor(x, y, vx, vy, color) {
            this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color;
            this.life = 40 + ((Math.random() * 40) | 0);
            this.age = 0; this.size = rand(2, 4); this.gravity = 0.08;
        }
        update() {
            this.vy += this.gravity; this.x += this.vx; this.y += this.vy; this.age++;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, 1 - this.age / this.life);
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // --- spawn / control ---
    function launchRandomRocket() {
        // limit rockets if too many particles
        if (particles.length > MAX_PARTICLES()) return;
        rockets.push(new Rocket(rand(100, Math.max(200, W - 100))));
    }

    function spawnConfettiBurst(x, y, count = 40) {
        const effectiveCount = Math.min(count, Math.max(6, Math.floor((MAX_PARTICLES() - particles.length) / 8)));
        for (let i = 0; i < effectiveCount; i++) {
            particles.push(new Confetti(x + rand(-20, 20), y + rand(-20, 20)));
        }
    }

    // hearts DOM spawner (création légère)
    function spawnHeart() {
        if (prefersReducedMotion) return; // respect accessibility
        const h = document.createElement('div');
        h.className = 'heart';
        const left = rand(8, 92);
        h.style.left = left + '%';
        const size = Math.floor(rand(22, isMobile() ? 36 : 48));
        h.style.width = size + 'px';
        h.style.height = size + 'px';
        const dur = rand(5, isMobile() ? 8 : 11);
        h.style.animationDuration = dur + 's';
        h.style.animationDelay = rand(0, 0.6) + 's';
        heartsContainer.appendChild(h);
        // cleanup
        setTimeout(() => { h.remove(); }, (dur + 0.8) * 1000);
    }

    // --- main loop ---
    function loop() {
        if (!running) return;
        // clear in CSS pixels
        ctx.clearRect(0, 0, W, H);

        // rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
            rockets[i].update();
            rockets[i].draw(ctx);
            if (rockets[i].exploded) rockets.splice(i, 1);
        }

        // particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw(ctx);
            // bounds + lifetime filter
            if (p.y > H + 80 || p.x < -80 || p.x > W + 80) particles.splice(i, 1);
            if (p.age && p.age > (p.life || 200)) particles.splice(i, 1);
        }

        // cap global particle count to avoid memory blowup
        const cap = MAX_PARTICLES();
        if (particles.length > cap) {
            particles.splice(0, particles.length - cap);
        }

        requestAnimationFrame(loop);
    }

    // --- timers management (start / stop) ---
    function startTimers() {
        if (prefersReducedMotion) {
            // small static burst only
            spawnConfettiBurst(W / 2, H / 2, 40);
            return;
        }
        // safety: clear any existing
        stopTimers();

        rocketTimer = setInterval(launchRandomRocket, isMobile() ? 1200 : 900);
        confettiTimer = setInterval(() => spawnConfettiBurst(rand(120, Math.max(240, W - 120)), rand(H * 0.15, H * 0.45), isMobile() ? 10 : 20), isMobile() ? 1800 : 1600);
        heartTimer = setInterval(() => spawnHeart(), isMobile() ? 900 : 600);

        // initial big burst
        setTimeout(() => spawnConfettiBurst(W / 2, H / 2, isMobile() ? 80 : 160), 300);
        setTimeout(() => { launchRandomRocket(); launchRandomRocket(); }, 700);
    }

    function stopTimers() {
        if (rocketTimer) { clearInterval(rocketTimer); rocketTimer = null; }
        if (confettiTimer) { clearInterval(confettiTimer); confettiTimer = null; }
        if (heartTimer) { clearInterval(heartTimer); heartTimer = null; }
    }

    // start/stop visuals
    function start() {
        if (running) return;
        running = true;
        loop();
        startTimers();
    }
    function stop() {
        running = false;
        stopTimers();
        // clear arrays to free memory
        particles.length = 0;
        rockets.length = 0;
        // clear canvas
        ctx.clearRect(0, 0, W, H);
        // remove any lingering hearts
        Array.from(heartsContainer.querySelectorAll('.heart')).forEach(n => n.remove());
    }

    // initial start
    if (!prefersReducedMotion) loop();
    startTimers();

    // toggle control (button expected in DOM)
    const toggleBtn = document.getElementById('toggleLights');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (running) stop();
            else start();
        });
    } else {
        // si pas de bouton, expose global toggle pour debug
        window.toggleCelebration = () => { if (running) stop(); else start(); };
    }

    // accessibility: space toggle (via the toggle button if present)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (toggleBtn) toggleBtn.click();
            else window.toggleCelebration && window.toggleCelebration();
        }
    });

    // cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopTimers();
    });

})();
