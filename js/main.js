const name = prompt("Quel est ton prénom ? ❤️");


const question = document.getElementById("question");
question.textContent = `Veux-tu être ma Valentine, ${name || 'mon amour'} ?`;


const noBtn = document.getElementById("noBtn");
const yesBtn = document.getElementById("yesBtn");


noBtn.addEventListener("mouseover", () => {
    const x = Math.random() * 300;
    const y = Math.random() * 50;


    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
});


yesBtn.addEventListener("click", () => {
    window.location.href = "celebration.html";
});