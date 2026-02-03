const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


const confettis = Array.from({ length: 150 }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 6 + 2,
    d: Math.random() * 2 + 1,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
}));


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    confettis.forEach(c => {
        ctx.beginPath();
        ctx.fillStyle = c.color;
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();


        c.y += c.d;
        if (c.y > canvas.height) c.y = 0;
    });


    requestAnimationFrame(draw);
}


draw();