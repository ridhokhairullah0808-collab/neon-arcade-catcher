// MENGAMBIL ELEMEN HTML
const gameArena = document.getElementById("game-arena");
const playerElement = document.getElementById("player");

const timerElement = document.getElementById("timer");
const livesElement = document.getElementById("lives");
const scoreElement = document.getElementById("score");
const messageElement = document.getElementById("message");

// DAFTAR ITEM ARCADE
const arcadeItems = [
    { symbol: "⭐", type: "star", points: 100 },
    { symbol: "⭐", type: "star", points: 100 },
    { symbol: "💎", type: "gem", points: 250 },
    { symbol: "💣", type: "bomb", points: 0 }
];

// VARIABEL PERMAINAN
let score = 0;
let lives = 3;
let caughtCount = 0;
let timeLeft = 60;
let highScore = Number(localStorage.getItem("starCatcherHighScore")) || 0;

let playerX = 250;
let playerSpeed = 8;
let keys = { left: false, right: false };

let isPlaying = false;
let timerInterval = null;
let spawnInterval = null;
let animationFrameId = null;
let fallingObjects = [];

// MENGATUR PERPINDAHAN HALAMAN
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    document.getElementById(screenId).classList.add("active");
}

// MENAMPILKAN HALAMAN AWAL
function showHome() {
    stopAllLoops();
    showScreen("home-screen");
}

// MENAMPILKAN PETUNJUK
function showInstructions() {
    showScreen("instruction-screen");
}

// MENGHENTIKAN SEMUA LOOP
function stopAllLoops() {
    isPlaying = false;
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    cancelAnimationFrame(animationFrameId);
}

// MEMULAI PERMAINAN
function startGame() {
    stopAllLoops();

    score = 0;
    lives = 3;
    caughtCount = 0;
    timeLeft = 60;
    fallingObjects = [];

    scoreElement.textContent = score;
    updateLivesDisplay();
    timerElement.textContent = "01:00";
    messageElement.textContent = "Tangkap bintang & permata, hindari bom!";

    // Bersihkan item lama di arena
    document.querySelectorAll(".falling-item").forEach(el => el.remove());

    showScreen("game-screen");

    // Posisikan pemain di tengah arena
    playerX = (gameArena.clientWidth - playerElement.offsetWidth) / 2;
    playerElement.style.left = playerX + "px";
    playerElement.style.transform = "none";

    isPlaying = true;
    startTimer();
    startSpawner();
    gameLoop();
}

// UPDATE TAMPILAN NYAWA
function updateLivesDisplay() {
    livesElement.textContent = lives > 0 ? "❤️".repeat(lives) : "💔";
}

// TIMER HITUNG MUNDUR
function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPlaying) return;
        timeLeft--;

        let minutes = Math.floor(timeLeft / 60);
        let remainingSeconds = timeLeft % 60;
        timerElement.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(remainingSeconds).padStart(2, "0");

        if (timeLeft <= 0) {
            endGame(true);
        }
    }, 1000);
}

// MEMUNCULKAN ITEM JATUH
function startSpawner() {
    spawnInterval = setInterval(() => {
        if (!isPlaying) return;

        const template = arcadeItems[Math.floor(Math.random() * arcadeItems.length)];
        const itemEl = document.createElement("div");
        itemEl.classList.add("falling-item");
        itemEl.textContent = template.symbol;

        const maxX = gameArena.clientWidth - 40;
        const startX = Math.max(5, Math.floor(Math.random() * maxX));
        itemEl.style.left = startX + "px";
        itemEl.style.top = "-35px";

        gameArena.appendChild(itemEl);

        // Kecepatan meningkat seiring berjalannya waktu
        const speedBonus = (60 - timeLeft) * 0.04;
        fallingObjects.push({
            el: itemEl,
            x: startX,
            y: -35,
            speed: 3 + Math.random() * 2 + speedBonus,
            type: template.type,
            points: template.points
        });
    }, 650);
}

// LOOP UTAMA GAME ARCADE
function gameLoop() {
    if (!isPlaying) return;

    // Gerakan pemain
    const maxPlayerX = gameArena.clientWidth - playerElement.offsetWidth;
    if (keys.left) {
        playerX = Math.max(0, playerX - playerSpeed);
    }
    if (keys.right) {
        playerX = Math.min(maxPlayerX, playerX + playerSpeed);
    }
    playerElement.style.left = playerX + "px";

    const playerRect = playerElement.getBoundingClientRect();

    // Update posisi setiap objek jatuh
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        obj.y += obj.speed;
        obj.el.style.top = obj.y + "px";

        const objRect = obj.el.getBoundingClientRect();

        // Cek tabrakan dengan pesawat/keranjang pemain
        const isColliding = !(
            objRect.right < playerRect.left + 8 ||
            objRect.left > playerRect.right - 8 ||
            objRect.bottom < playerRect.top + 8 ||
            objRect.top > playerRect.bottom - 8
        );

        if (isColliding) {
            if (obj.type === "bomb") {
                lives--;
                updateLivesDisplay();
                messageElement.textContent = "💥 DUAR! Terkena bom! (-1 Nyawa)";
                if (lives <= 0) {
                    obj.el.remove();
                    fallingObjects.splice(i, 1);
                    endGame(false);
                    return;
                }
            } else {
                score += obj.points;
                caughtCount++;
                scoreElement.textContent = score;
                messageElement.textContent =
                    obj.type === "gem"
                        ? "💎 Mantap! Permata +250 poin!"
                        : "⭐ Bagus! Bintang +100 poin!";
            }

            obj.el.remove();
            fallingObjects.splice(i, 1);
            continue;
        }

        // Hapus jika melewati batas bawah arena
        if (obj.y > gameArena.clientHeight) {
            obj.el.remove();
            fallingObjects.splice(i, 1);
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// MENGAKHIRI PERMAINAN
function endGame(survived) {
    stopAllLoops();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("starCatcherHighScore", highScore);
    }

    document.getElementById("end-icon").textContent = survived ? "🏆" : "💥";
    document.getElementById("end-title").textContent = survived ? "TIME'S UP!" : "GAME OVER!";
    document.getElementById("end-subtitle").textContent = survived
        ? "Arcade Mission Complete!"
        : "Nyawa Kamu Habis!";
    document.getElementById("end-desc").textContent = survived
        ? "Hebat! Kamu berhasil bertahan hingga waktu habis!"
        : "Hati-hati terhadap bom meteor di percobaan berikutnya!";

    document.getElementById("final-score").textContent = score;
    document.getElementById("final-caught").textContent = caughtCount;
    document.getElementById("high-score").textContent = highScore;

    showScreen("win-screen");
}

// KONTROL KEYBOARD
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.left = true;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.right = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.left = false;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.right = false;
    }
});

// KONTROL TOMBOL LAYAR / SENTUH
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

btnLeft.addEventListener("mousedown", () => (keys.left = true));
btnLeft.addEventListener("mouseup", () => (keys.left = false));
btnLeft.addEventListener("mouseleave", () => (keys.left = false));
btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); keys.left = true; });
btnLeft.addEventListener("touchend", () => (keys.left = false));

btnRight.addEventListener("mousedown", () => (keys.right = true));
btnRight.addEventListener("mouseup", () => (keys.right = false));
btnRight.addEventListener("mouseleave", () => (keys.right = false));
btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); keys.right = true; });
btnRight.addEventListener("touchend", () => (keys.right = false));

// KONTROL GESER DI ARENA (TOUCH / MOUSE DRAG)
gameArena.addEventListener("touchmove", (e) => {
    if (!isPlaying) return;
    const rect = gameArena.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left - playerElement.offsetWidth / 2;
    const maxPlayerX = gameArena.clientWidth - playerElement.offsetWidth;
    playerX = Math.max(0, Math.min(maxPlayerX, touchX));
});
