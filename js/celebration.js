// celebration.js — combine confetti + fireworks + hearts


(() => {
    const canvas = document.getElementById('fxCanvas');
    const ctx = canvas.getContext('2d');
    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;
    let particles = [];
    let rockets = [];
    let heartsContainer = document.getElementById('hearts');
    let running = true;


// resize handling
    window.addEventListener('resize', () => {
        W = canvas.width = innerWidth;
        H = canvas.height = innerHeight;
    });


// utils
    const rand = (a,b) => Math.random()*(b-a)+a;
    const COLORS = ['#ff4e50','#ff7a8a','#ffd166','#f9d423','#7ee7c7','#b39ddb'];
    // --- Confetti particle class (colored rectangles) ---
    class Confetti {
        constructor(x,y){
            this.x = x; this.y = y;
            this.w = rand(6,12); this.h = rand(8,18);
            this.color = COLORS[(Math.random()*COLORS.length)|0];
            this.vx = rand(-3,3);
            this.vy = rand(-8,-2);
            this.rot = rand(0,Math.PI*2);
            this.vr = rand(-0.12,0.12);
            this.gravity = 0.26;
            this.drag = 0.995;
        }
        update(){
            this.vx *= this.drag;
            this.vy += this.gravity;
            this.x += this.vx; this.y += this.vy;
            this.rot += this.vr;
        }
        draw(ctx){
            ctx.save();
            ctx.translate(this.x,this.y);
            ctx.rotate(this.rot);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h);
            ctx.restore();
        }}


// --- Rocket & explosion for fireworks ---
    class Rocket {
        constructor(x){
            this.x = x; this.y = H + 10;
            this.vx = rand(-1,1);
            this.vy = rand(-10,-13);
            this.targetY = rand(H*0.2, H*0.45);
            this.exploded = false;
            this.color = COLORS[(Math.random()*COLORS.length)|0];
        }
        update(){
            this.vy += 0.2; // gravity
            this.x += this.vx; this.y += this.vy;
            if(this.y <= this.targetY && !this.exploded){
                this.explode();
                this.exploded = true;
            }
        }
        draw(ctx){
            ctx.beginPath(); ctx.arc(this.x,this.y,2.4,0,Math.PI*2); ctx.fillStyle=this.color; ctx.fill();
        }explode(){
            const n = 28 + (Math.random()*24)|0;
            for(let i=0;i<n;i++){
                const angle = Math.random()*Math.PI*2;
                const speed = rand(1.8,6);
                particles.push(new ExplosionParticle(this.x,this.y,Math.cos(angle)*speed,Math.sin(angle)*speed,this.color));
            }
// also spawn some confetti inside explosion
            for(let i=0;i<12;i++) particles.push(new Confetti(this.x + rand(-8,8), this.y + rand(-8,8)));
        }
    }


    class ExplosionParticle {
        constructor(x,y,vx,vy,color){
            this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.color=color;
            this.life = 40 + (Math.random()*30|0);
            this.age = 0; this.size = rand(2,4); this.gravity = 0.08;
        }
        update(){
            this.vy += this.gravity; this.x += this.vx; this.y += this.vy; this.age++;
        }
        draw(ctx){
            ctx.globalAlpha = Math.max(0,1 - this.age/this.life);
            ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fillStyle=this.color; ctx.fill();
            ctx.globalAlpha = 1;
        }
    }


// spawn routine
    function launchRandomRocket(){
        rockets.push(new Rocket(rand(100,W-100)));
    }


    function spawnConfettiBurst(x,y,count=40){
        for(let i=0;i<count;i++) particles.push(new Confetti(x + rand(-20,20), y + rand(-20,20)));
    }


// hearts DOM
    function spawnHeart(){
        const h = document.createElement('div');
        h.className = 'heart';
        const left = rand(10, 90);
        h.style.left = left + '%';
        const delay = rand(0,0.6);
        const dur = rand(5, 11);
        h.style.animationDuration = dur + 's';
        h.style.animationDelay = delay + 's';
        heartsContainer.appendChild(h);
        setTimeout(()=> h.remove(), (dur+1)*1000);
    }


// main loop
    function loop(){
        if(!running) return;
        ctx.clearRect(0,0,W,H);// update rockets
        for(let i=rockets.length-1;i>=0;i--){
            rockets[i].update();
            rockets[i].draw(ctx);
            if(rockets[i].exploded) rockets.splice(i,1);
        }


// update particles
        for(let i=particles.length-1;i>=0;i--){
            const p = particles[i];
            p.update();
            p.draw(ctx);
// bounds + lifetime filter
            if(p.y > H + 50 || p.x < -50 || p.x > W + 50) particles.splice(i,1);
            if(p.age && p.age > (p.life||100)) particles.splice(i,1);
        }


        requestAnimationFrame(loop);
    }


// periodic events
    let rocketTimer = setInterval(launchRandomRocket, 900);
    let confettiTimer = setInterval(()=> spawnConfettiBurst(rand(120,W-120), rand(H*0.15,H*0.45), 20), 1600);
    let heartTimer = setInterval(spawnHeart, 600);


// initial big burst
    setTimeout(()=> spawnConfettiBurst(W/2, H/2, 160), 300);
    setTimeout(()=> { launchRandomRocket(); launchRandomRocket(); }, 700);


    loop();


// toggle lights control (stop/start effects)
    document.getElementById('toggleLights').addEventListener('click', ()=>{
        running = !running;
        if(running){ loop(); rocketTimer = setInterval(launchRandomRocket, 900); confettiTimer = setInterval(()=> spawnConfettiBurst(rand(120,W-120), rand(H*0.15,H*0.45), 20), 1600); heartTimer = setInterval(spawnHeart, 600); }
        else { clearInterval(rocketTimer); clearInterval(confettiTimer); clearInterval(heartTimer); }
    });


// small accessibility: press space to toggle
    window.addEventListener('keydown', (e)=>{ if(e.code==='Space') document.getElementById('toggleLights').click(); });


})();