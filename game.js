//fix countdown timer message
//document better
//REMOVE DUPLICATES  CLEAN UP

let currentOperation = 'addition';
let currentDifficulty = 'easy';
let score = 0;
let streak = 0;
let totalAttempts = 0;
let timerActive = false;
let timeRemaining = 30;
let timerInterval;
let isMultiplayer = false;
let currentPlayer = 1;
let p1Score = 0;
let p2Score = 0;
let totalTime = 0;
let questionsStartTime;
let isMultiplayerRound = false;
let multiplayerTimer = 15;
let multiplayerInterval;

const achievements = {
    streaks: [
        { id: 'streak5', name: 'High Five!', requirement: 5, description: 'Get a streak of 5 correct answers', awarded: false },
        { id: 'streak10', name: 'Perfect Ten!', requirement: 10, description: 'Get a streak of 10 correct answers', awarded: false },
        { id: 'streak15', name: 'Unstoppable!', requirement: 15, description: 'Get a streak of 15 correct answers', awarded: false },
        { id: 'streak20', name: 'Math Master!', requirement: 20, description: 'Get a streak of 20 correct answers', awarded: false }
    ],
    accuracy: [
        { id: 'accuracy100_15', name: 'Sharp Shooter!', 
          requirement: { accuracy: 100, questions: 15 }, 
          description: '100% accuracy over 15 questions', 
          }
    ]
};

const backgroundMusic = document.getElementById('backgroundMusic');
const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');
const toggleMusicButton = document.getElementById('toggleMusic');
const volumeSlider = document.getElementById('volumeSlider');


let isMusicPlaying = false;

const difficultyRanges = {
    easy: { min: 1, max: 10 },
    medium: { min: 10, max: 25 },
    hard: { min: 25, max: 100 }
};



document.addEventListener('DOMContentLoaded', function() {
    // Start page functionality
    const startButton = document.getElementById('start-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const playerNameInput = document.getElementById('player-name');

    if (startButton && playerNameInput) {  // Check if we're on start page
        // Check if there's a saved name
        const savedName = localStorage.getItem('currentPlayer');
        if (savedName) {
            playerNameInput.value = savedName;
        }

        startButton.addEventListener('click', function() {
            const playerName = playerNameInput.value.trim();
            if (!playerName) {
                alert('Please enter your name first!');
                return;
            }
            
            // Save the player name
            localStorage.setItem('currentPlayer', playerName);
            
            // Redirect to game
            window.location.href = 'mathgame.html';
        });

        leaderboardButton.addEventListener('click', function() {
            window.location.href = 'leaderboard.html';
        });
    }

    // Leaderboard page functionality
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    if (leaderboardEntries) {  // Check if we're on leaderboard page
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        
        // Clear existing entries
        leaderboardEntries.innerHTML = '';
        
        // Add leaderboard entries
        leaderboard.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            `;
            leaderboardEntries.appendChild(entryElement);
        });
        
        // Fill empty slots if less than 5 entries
        while (leaderboardEntries.children.length < 5) {
            const emptyEntry = document.createElement('div');
            emptyEntry.className = 'leaderboard-entry empty';
            emptyEntry.innerHTML = `
                <span class="rank">${leaderboardEntries.children.length + 1}</span>
                <span class="name">---</span>
                <span class="score">---</span>
            `;
            leaderboardEntries.appendChild(emptyEntry);
        }
    }
});

function toggleMusic() {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        toggleMusicButton.textContent = '🔈 Music';
        toggleMusicButton.classList.add('muted');
    } else {
        backgroundMusic.play();
        toggleMusicButton.textContent = '🔊 Music';
        toggleMusicButton.classList.remove('muted');
    }
    isMusicPlaying = !isMusicPlaying;
}

// Add click event listener for the music toggle button
toggleMusicButton.addEventListener('click', toggleMusic);

// Set initial volume
backgroundMusic.volume = correctSound.volume = wrongSound.volume = 0.5;

function disableOptions(disable) {
    const options = document.querySelectorAll('.option-button');
    options.forEach(button => {
        button.style.pointerEvents = disable ? 'none' : 'auto';
        button.style.opacity = disable ? '0.7' : '1';
    });
}

function showCountdown(callback) {
    const countdownElement = document.getElementById('countdown');
    const counts = ['3', '2', '1', 'GO!'];
    let i = 0;

    // Disable options during countdown
    disableOptions(true);

    function showNumber() {
        if (i < counts.length) {
            countdownElement.textContent = counts[i];
            countdownElement.classList.add('show');
            setTimeout(() => {
                countdownElement.classList.remove('show');
                setTimeout(showNumber, 500);
            }, 1000);
            i++;
        } else {
            disableOptions(false); // Re--enable options after countdon
            callback();
        }
    }

    showNumber();
}

function updateReportData() {
    const accuracyPercentage = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    const avgTime = totalAttempts > 0 ? Math.round(totalTime / totalAttempts) : 0;
    
    localStorage.setItem('accuracy', `${accuracyPercentage}%`);
    localStorage.setItem('questionsSolved', totalAttempts.toString());
    localStorage.setItem('avgTime', `${avgTime}s`);
}

function setOperation(operation) {
    currentOperation = operation;
    document.querySelectorAll('.controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    generateNewProblem();
}

function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    document.querySelectorAll('.difficulty-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    generateNewProblem();
}

function generateNumber() {
    const range = difficultyRanges[currentDifficulty];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function generateNewProblem() {
    let num1 = generateNumber();
    let num2 = generateNumber();
    let problem, answer;

    if (currentOperation === 'division') {
        num1 = num1 * num2;
        problem = `${num1} ÷ ${num2}`;
        answer = num1 / num2;
    } else {
        problem = `${num1} ${getOperationSymbol()} ${num2}`;
        answer = calculateAnswer(num1, num2);
    }

    document.getElementById('problem').textContent = problem;
    generateOptions(answer);
    
    questionsStartTime = Date.now();
}

function getOperationSymbol() {
    switch (currentOperation) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '×';
        case 'division': return '÷';
    }
}

function calculateAnswer(num1, num2) {
    switch (currentOperation) {
        case 'addition': return num1 + num2;
        case 'subtraction': return num1 - num2;
        case 'multiplication': return num1 * num2;
        case 'division': return num1 / num2;
    }
}

function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const newOption = Math.random() < 0.5 ? correctAnswer + offset : correctAnswer - offset;
        if (!options.includes(newOption)) {
            options.push(newOption);
        }
    }

    options.sort(() => Math.random() - 0.5);

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.onclick = () => checkAnswer(option, correctAnswer);
        optionsContainer.appendChild(button);
    });
}

function showFeedback(isCorrect) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = isCorrect ? '✓' : '✗';
    feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;

    setTimeout(() => {
        feedback.className = 'feedback';
    }, 500);
}

function checkAnswer(selected, correct) {
    const isCorrect = selected === correct;
    totalAttempts++;
    
    const timeForQuestion = (Date.now() - questionsStartTime) / 1000;
    totalTime += timeForQuestion;

    if (isCorrect) {
        correctSound.play();
        score++;
        streak++;
        if (isMultiplayerRound) {
            if (currentPlayer === 1) {
                p1Score++;
            } else {
                p2Score++;
            }
            updateMultiplayerScores();
        }
    } else {
        wrongSound.play();
        streak = 0;
    }

    showFeedback(isCorrect);
    updateStats();
    checkAchievements();
    updateReportData();
    generateNewProblem();
}

function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
    document.getElementById('accuracy').textContent =
        `${Math.round((score / totalAttempts) * 100)}%`;
}

function toggleTimer() {
    timerActive = !timerActive;
    if (timerActive) {
        score = 0;
        timeRemaining = 30;
        updateTimer();
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimer();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                showTimerEndMessage();
                resetGame();
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        document.getElementById('timer').textContent = 'Timer Off';
    }
}

function updateTimer() {
    document.getElementById('timer').textContent = `Time: ${timeRemaining}s`;
}

function showTimerEndMessage() {
    const playerName = localStorage.getItem('currentPlayer');
    updateLeaderboard(playerName, score);
    const winnerAnnouncement = document.getElementById('winner-announcement');
    winnerAnnouncement.textContent = `Great Effort ${playerName}!\nFinal Score: ${score}`;
    winnerAnnouncement.classList.add('show');
    
    setTimeout(() => {
        winnerAnnouncement.classList.remove('show');
        window.location.href = 'leaderboard.html';
    }, 3000);
}

function toggleMultiplayer() {
    isMultiplayer = !isMultiplayer;
    const multiplayerArea = document.getElementById('multiplayer-area');
    
    if (isMultiplayer) {
        multiplayerArea.style.display = 'block';
        startMultiplayerRound();
    } else {
        multiplayerArea.style.display = 'none';
        if (multiplayerInterval) {
            clearInterval(multiplayerInterval);
        }
        resetGame();
    }
}

function startMultiplayerRound() {
    resetGame();
    currentPlayer = 1;
    p1Score = 0;
    p2Score = 0;
    updateMultiplayerScores();
    
    showCountdown(() => {
        startPlayerTurn();
    });
}

function startPlayerTurn() {
    multiplayerTimer = 15;
    updateMultiplayerTimer();
    isMultiplayerRound = true;
    
    multiplayerInterval = setInterval(() => {
        multiplayerTimer--;
        updateMultiplayerTimer();
        
        if (multiplayerTimer <= 0) {
            clearInterval(multiplayerInterval);
            handleTurnEnd();
        }
    }, 1000);
}

function updateMultiplayerTimer() {
    const timerElement = document.getElementById(`p${currentPlayer}-time`);
    timerElement.textContent = `${multiplayerTimer}s`;
}

function updateMultiplayerScores() {
    document.getElementById('p1-score').textContent = p1Score;
    document.getElementById('p2-score').textContent = p2Score;
}

function handleTurnEnd() {
    if (currentPlayer === 1) {
        currentPlayer = 2;
        const winnerAnnouncement = document.getElementById('winner-announcement');
        winnerAnnouncement.textContent = "Player 1 Done! Player 2 Get Ready!";
        winnerAnnouncement.classList.add('show');
        
        // Disable options during the transition
        disableOptions(true);
        
        setTimeout(() => {
            winnerAnnouncement.classList.remove('show');
            setTimeout(() => {
                showCountdown(() => {
                    startPlayerTurn();
                });
            }, 500);
        }, 8000); // Show message for 5 seconds
    } else {
        announceWinner();
    }
}

function announceWinner() {
    const winnerAnnouncement = document.getElementById('winner-announcement');
    let message;
    
    if (p1Score > p2Score) {
        message = `Player 1 Wins!\nScore: ${p1Score} vs ${p2Score}`;
    } else if (p2Score > p1Score) {
        message = `Player 2 Wins!\nScore: ${p2Score} vs ${p1Score}`;
    } else {
        message = `It's a Tie!\nScore: ${p1Score} vs ${p2Score}`;
    }
    
    winnerAnnouncement.textContent = message;
    winnerAnnouncement.classList.add('show');

    if (p1Score !== p2Score) {
        confetti.start();
    }
    
    setTimeout(() => {
        winnerAnnouncement.classList.remove('show');
        isMultiplayer = false;
        document.getElementById('multiplayer-area').style.display = 'none';
        resetGame();
        confetti.stop(); // Stop confetti after announcement
    }, 3000);
}

function resetGame() {
    score = 0;
    streak = 0;
    totalAttempts = 0;
    p1Score = 0;
    p2Score = 0;
    currentPlayer = 1;
    totalTime = 0;
    isMultiplayerRound = false;
    if (multiplayerInterval) {
        clearInterval(multiplayerInterval);
    }
    updateStats();
    updateReportData();
    updateMultiplayerScores();
    generateNewProblem();
}

volumeSlider.addEventListener('input', function() {
    const volume = this.value;
    backgroundMusic.volume = volume;
});


// Confetti animation class
class Confetti {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 150;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                rotation: Math.random() * 360,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                size: Math.random() * 10 + 5,
                speedY: Math.random() * 30 + 2,
                speedX: Math.random() * 2 - 1,
                speedRotation: (Math.random() - 0.5) * 2
            });
        }
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate((particle.rotation * Math.PI) / 180);
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.moveTo(-particle.size/2, -particle.size/2);
        this.ctx.lineTo(0, -particle.size);
        this.ctx.lineTo(particle.size/2, -particle.size/2);
        this.ctx.lineTo(particle.size/2, particle.size/2);
        this.ctx.lineTo(-particle.size/2, particle.size/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.y += particle.speedY;
            particle.x += particle.speedX;
            particle.rotation += particle.speedRotation;
            
            // Remove particles that have fallen below the screen
            if (particle.y > this.canvas.height + particle.size) {
                this.particles.splice(i, 1);
            }
        }
        
        // Stop animation when all particles are gone
        if (this.particles.length === 0) {
            this.stop();
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateParticles();
        this.particles.forEach(particle => this.drawParticle(particle));
        
        if (this.isAnimating) {
            requestAnimationFrame(() => this.animate());
        }
    }
    
    start() {
        this.isAnimating = true;
        this.particles = [];
        this.createParticles();
        this.animate();
        
        // Play celebration sound
        const celebrationSound = new Audio('https://cdnjs.cloudflare.com/media/celebration.mp3');
        celebrationSound.volume = 0.5;
        celebrationSound.play().catch(() => console.log('Sound autoplay prevented'));
    }
    
    stop() {
        this.isAnimating = false;
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

let achievementsUnlocked = new Set();


function checkAchievements() {
    // Check streak achievements
    achievements.streaks.forEach(achievement => {
        if (streak == achievement.requirement) {
            awardAchievement(achievement);
        }
    });

    // Check accuracy achievements
    achievements.accuracy.forEach(achievement => {
        if (!achievement.awarded && 
            totalAttempts == achievement.requirement.questions && 
            (score / totalAttempts) * 100 === achievement.requirement.accuracy) {
            awardAchievement(achievement);
        }
    });
}

function awardAchievement(achievement) {
    // Create achievement notification
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Play achievement sound
    const achievementSound = new Audio('https://cdnjs.cloudflare.com/media/achievement.mp3');
    achievementSound.volume = 0.5;
    achievementSound.play().catch(() => console.log('Sound autoplay prevented'));
    
    // Remove notification after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}



function updateLeaderboard(playerName, score) {
    // Check if we have a valid player name
    if (!playerName) {
        playerName = localStorage.getItem('currentPlayer') || 'Anonymous';
    }
    
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    leaderboard.push({ name: playerName, score: score });
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 5
    leaderboard = leaderboard.slice(0, 5);
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const container = document.getElementById('leaderboard-entries');
    if (!container) return; // Only run on leaderboard page
    
    container.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'leaderboard-entry';
        entryElement.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
        `;
        container.appendChild(entryElement);
    });

    // Fill empty slots
    while (container.children.length < 5) {
        const emptyEntry = document.createElement('div');
        emptyEntry.className = 'leaderboard-entry empty';
        emptyEntry.innerHTML = `
            <span class="rank">${container.children.length + 1}</span>
            <span class="name">---</span>
            <span class="score">---</span>
        `;
        container.appendChild(emptyEntry);
    }
}



document.addEventListener('DOMContentLoaded', function() {
    displayLeaderboard(); // This will only run on the leaderboard page
});


// Create the confetti instance
const confetti = new Confetti();

// Initialize the game
generateNewProblem();