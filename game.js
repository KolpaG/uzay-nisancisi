// --- YENİ KONTROL DEĞİŞKENLERİ ---
const controlSelectionOverlay = document.getElementById('control-selection-overlay');
const btnPc = document.getElementById('btn-pc');
const btnMobil = document.getElementById('btn-mobil');

const mobileControlsContainer = document.getElementById('mobile-controls-container');
const btnMobilLeft = document.getElementById('btn-mobil-left');
const btnMobilRight = document.getElementById('btn-mobil-right');
const btnMobilShoot = document.getElementById('btn-mobil-shoot');

let controlMode = null; // 'pc' veya 'mobil'

// Canvas ve context'i al
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// --- Oyun Değişkenleri ---
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
let score = 0;
let isGameOver = false;

// LocalStorage'dan rekoru yükle, yoksa 0 olarak ayarla
let highScore = localStorage.getItem('spaceShooterHighScore') ? parseInt(localStorage.getItem('spaceShooterHighScore')) : 0;
highScoreElement.textContent = `Rekor: ${highScore}`;

// --- Oyuncu Gemi Ayarları ---
const player = {
    x: GAME_WIDTH / 2 - 25, 
    y: GAME_HEIGHT - 60,
    width: 50,
    height: 50,
    color: '#00ccff', 
    speed: 7,
    bullets: [],
    canShoot: true, // Ateş etme bekleme süresi için yeni değişken
    shootCooldown: 150, // Milisaniye cinsinden bekleme süresi
    lastShotTime: 0
};

// --- Mermi Ayarları ---
const bullet = {
    width: 5,
    height: 15,
    color: '#ffdd00', 
    speed: 10
};

// --- Düşman Ayarları ---
const enemy = {
    width: 40,
    height: 40,
    color: '#ff0000', 
    speed: 2,
    list: []
};

// --- Klavye Girişleri (Sadece hareket için WASD) ---
const keys = {
    KeyA: false, // Sol
    KeyD: false, // Sağ
};

document.addEventListener('keydown', (e) => {
    // PC kontrolleri SADECE pc modunda çalışsın
    if (controlMode === 'pc' && keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
    // 'R' ile yeniden başlatma her zaman çalışsın (PC'de olanlar için)
    if (isGameOver && e.code === 'KeyR') {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    // PC kontrolleri SADECE pc modunda çalışsın
    if (controlMode === 'pc' && keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// --- Fare Tıklaması ile Ateş Etme (Mouse1) ---
canvas.addEventListener('click', (e) => {
    // PC mouse tıklaması SADECE pc modunda çalışsın
    if (controlMode === 'pc' && !isGameOver) {
        shootBullet();
    }
});

// --- YENİ EKLENDİ: Mobil Kontrol Dinleyicileri ---
// Dokunma başladığında tuşu aktif et
btnMobilLeft.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Ekranın kaymasını engelle
    keys.KeyA = true;
});
btnMobilRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.KeyD = true;
});
btnMobilShoot.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isGameOver) {
        shootBullet();
    }
});

// Dokunma bittiğinde tuşu bırak
btnMobilLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.KeyA = false;
});
btnMobilRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.KeyD = false;
});

function shootBullet() {
    const currentTime = Date.now();
    
    // Soğuma süresi (cooldown) kontrolü
    if (currentTime - player.lastShotTime > player.shootCooldown) {
        player.bullets.push({
            x: player.x + player.width / 2 - bullet.width / 2, 
            y: player.y
        });
        player.lastShotTime = currentTime;
    }
}

// --- Puanlama Fonksiyonu ---
function updateScore(points) {
    const newScore = score + points;

    // SKOR KISITLAMASI: Skorun 0'ın altına düşmesini engelle
    if (newScore < 0) {
        score = 0; 
    } else {
        score = newScore;
    }

    scoreElement.textContent = `Skor: ${score}`;

    // Rekor Kontrolü
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = `Rekor: ${highScore}`;
        localStorage.setItem('spaceShooterHighScore', highScore); 
    }
}

// Oyuncu gemisini çiz
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y - 15); 
    ctx.lineTo(player.x, player.y);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.closePath();
    ctx.fill();
}

// Mermileri çiz
function drawBullets() {
    ctx.fillStyle = bullet.color;
    player.bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, bullet.width, bullet.height);
    });
}

// Düşmanları çiz
function drawEnemies() {
    ctx.fillStyle = enemy.color;
    enemy.list.forEach(e => {
        ctx.fillRect(e.x, e.y, enemy.width, enemy.height);
    });
}

// Oyuncu gemisini güncelle (Hareket ve sınırlar)
function updatePlayer() {
    // Kontroller KeyA (A) ve KeyD (D)
    if (keys.KeyA && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.KeyD && player.x < GAME_WIDTH - player.width) {
        player.x += player.speed;
    }
    // Ateş etme mantığı mouse click ve mobil tuş olaylarına taşındı.
}

// Mermileri güncelle (Hareket ve ekran dışına çıkma)
function updateBullets() {
    player.bullets.forEach(b => {
        b.y -= bullet.speed;
    });
    player.bullets = player.bullets.filter(b => b.y + bullet.height > 0);
}


let enemySpawnTimer = 0;
const enemySpawnInterval = 100;

// Düşmanları güncelle (Hareket, oluşturma ve puan düşürme)
function updateEnemies() {
    enemy.list.forEach(e => {
        e.y += enemy.speed;
    });
    
    // Ekran dışına çıkan düşmanları kontrol et (Puan düşüşü: -20)
    enemy.list = enemy.list.filter(e => {
        if (e.y < GAME_HEIGHT) { 
            return true;
        } else {
            // Düşman ekranın altına ulaştı: Ceza puanı -20
            updateScore(-20); 
            return false;
        }
    });

    // Yeni düşman oluşturma
    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnInterval) {
        enemy.list.push({
            x: Math.random() * (GAME_WIDTH - enemy.width), 
            y: -enemy.height 
        });
        enemySpawnTimer = 0;
    }
}

// Çarpışma kontrolü
function checkCollisions() {
    // Mermi ve Düşman çarpışması (Vurma: +100 Puan)
    player.bullets.forEach((b, bulletIndex) => {
        enemy.list.forEach((e, enemyIndex) => {
            if (b.x < e.x + enemy.width &&
                b.x + bullet.width > e.x &&
                b.y < e.y + enemy.height &&
                b.y + bullet.height > e.y) {
                
                // Vuruldu: Puan artışı
                updateScore(100); 

                // Mermiyi ve düşmanı kaldır
                player.bullets.splice(bulletIndex, 1);
                enemy.list.splice(enemyIndex, 1);
            }
        });
    });

    // Oyuncu ve Düşman çarpışması (GameOver)
    enemy.list.forEach(e => {
        if (player.x < e.x + enemy.width &&
            player.x + player.width > e.x &&
            player.y < e.y + enemy.height &&
            player.y + player.height > e.y) {
            
            // Düşman gemiye çarptı: Oyun Bitti
            gameOver();
        }
    });
}

// Oyun Bitti Ekranı
function gameOver() {
    isGameOver = true;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff00ff'; 
    ctx.font = '70px Impact, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText('BAŞARISIZ GÖREV!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

    ctx.fillStyle = '#00ffff';
    ctx.font = '36px Arial';
    ctx.fillText(`SON SKOR: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    ctx.fillText(`REKOR: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    ctx.fillText('Yeniden Başlamak İçin "R" Tuşuna Basın', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
}

// Oyunu sıfırla ve yeniden başlat
function resetGame() {
    score = 0;
    scoreElement.textContent = `Skor: 0`;
    player.x = GAME_WIDTH / 2 - player.width / 2;
    player.bullets = [];
    enemy.list = [];
    isGameOver = false;
    enemySpawnTimer = 0;
    player.lastShotTime = 0; // Zamanı sıfırla
    gameLoop(); 
}

// --- Ana Oyun Döngüsü ---
function gameLoop() {
    if (!isGameOver) {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); 
        
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkCollisions();

        drawPlayer();
        drawBullets();
        drawEnemies();

        requestAnimationFrame(gameLoop); 
    }
}

// --- YENİ EKLENDİ: Oyun Başlatma Mantığı ---

function initializeGame(mode) {
    controlMode = mode;
    
    // Seçim ekranını gizle
    controlSelectionOverlay.style.display = 'none';

    if (mode === 'mobil') {
        // Mobil kontrolleri göster
        mobileControlsContainer.style.display = 'block';
    }
    
    // Her şey hazır, ana döngüyü başlat
    gameLoop();
}

// Seçim butonlarına tıklama olaylarını ekle
btnPc.addEventListener('click', () => initializeGame('pc'));
btnMobil.addEventListener('click', () => initializeGame('mobil'));