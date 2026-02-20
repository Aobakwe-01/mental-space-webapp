// MentalSpace - Main JavaScript Functionality
// Handles mood tracking, breathing exercises, progress tracking, and animations

// Global state management
let currentMood = null;
let moodHistory = JSON.parse(localStorage.getItem('moodHistory')) || [];
let breathingTimer = null;
let breathingDuration = 180; // Default 3 minutes

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Create floating particles
    createFloatingParticles();
    
    // Initialize mood chart if on index page
    if (document.getElementById('moodChart')) {
        initializeMoodChart();
        updateProgressRing();
    }
    
    // Initialize mood selector
    initializeMoodSelector();
    
    // Initialize breathing exercise
    initializeBreathingExercise();
    
    // Add entrance animations
    addEntranceAnimations();
}

// Floating particles animation
function createFloatingParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Mood selector functionality
function initializeMoodSelector() {
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const submitButton = document.getElementById('submitMood');
    const moodNote = document.getElementById('moodNote');
    
    moodEmojis.forEach(emoji => {
        emoji.addEventListener('click', function() {
            // Remove previous selection
            moodEmojis.forEach(e => e.classList.remove('selected'));
            
            // Add selection to clicked emoji
            this.classList.add('selected');
            currentMood = parseInt(this.dataset.mood);
            
            // Animate selection
            anime({
                targets: this,
                scale: [1.2, 1.1],
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
    });
    
    if (submitButton) {
        submitButton.addEventListener('click', submitMoodCheckIn);
    }
}

function submitMoodCheckIn() {
    if (!currentMood) {
        alert('Please select how you\'re feeling first!');
        return;
    }
    
    const moodNote = document.getElementById('moodNote');
    const note = moodNote ? moodNote.value : '';
    
    // Save mood data
    const moodEntry = {
        mood: currentMood,
        note: note,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
    };
    
    // Add to history (remove any existing entry for today)
    moodHistory = moodHistory.filter(entry => entry.date !== moodEntry.date);
    moodHistory.push(moodEntry);
    
    // Keep only last 30 days
    if (moodHistory.length > 30) {
        moodHistory = moodHistory.slice(-30);
    }
    
    // Save to localStorage
    localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
    
    // Update UI
    updateMoodStatus();
    updateProgressRing();
    
    // Show success message
    showSuccessMessage('Mood check-in saved! 🌟');
    
    // Reset form
    document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('selected'));
    if (moodNote) moodNote.value = '';
    currentMood = null;
}

function updateMoodStatus() {
    const moodStatus = document.getElementById('moodStatus');
    if (moodStatus) {
        const today = new Date().toDateString();
        const todayEntry = moodHistory.find(entry => entry.date === today);
        
        if (todayEntry) {
            moodStatus.textContent = 'Completed';
            moodStatus.className = 'text-sm text-green-600 font-medium';
        } else {
            moodStatus.textContent = 'Pending';
            moodStatus.className = 'text-sm text-gray-400';
        }
    }
}

// Mood chart initialization
function initializeMoodChart() {
    const chartElement = document.getElementById('moodChart');
    if (!chartElement) return;
    
    const chart = echarts.init(chartElement);
    
    // Generate last 7 days data
    const last7Days = [];
    const moodData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayEntry = moodHistory.find(entry => entry.date === dateStr);
        moodData.push(dayEntry ? dayEntry.mood : null);
    }
    
    const option = {
        grid: {
            left: '10%',
            right: '10%',
            top: '10%',
            bottom: '15%'
        },
        xAxis: {
            type: 'category',
            data: last7Days,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#6B7280',
                fontSize: 12
            }
        },
        yAxis: {
            type: 'value',
            min: 1,
            max: 5,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { 
                show: true,
                lineStyle: {
                    color: 'rgba(0,0,0,0.05)'
                }
            }
        },
        series: [{
            data: moodData,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
                color: '#8FBC8F',
                width: 3
            },
            itemStyle: {
                color: '#8FBC8F',
                borderColor: '#fff',
                borderWidth: 2
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{
                        offset: 0, color: 'rgba(143, 188, 143, 0.3)'
                    }, {
                        offset: 1, color: 'rgba(143, 188, 143, 0.05)'
                    }]
                }
            }
        }]
    };
    
    chart.setOption(option);
    
    // Make chart responsive
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// Progress ring update
function updateProgressRing() {
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');
    
    if (!progressCircle || !progressText) return;
    
    // Calculate progress based on completed tasks
    let completedTasks = 0;
    let totalTasks = 2; // mood check-in + mindfulness
    
    // Check if mood check-in completed today
    const today = new Date().toDateString();
    const todayMood = moodHistory.find(entry => entry.date === today);
    if (todayMood) completedTasks++;
    
    // Add more task checks here as needed
    
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    const circumference = 2 * Math.PI * 28; // radius = 28
    const offset = circumference - (percentage / 100) * circumference;
    
    // Animate progress ring
    anime({
        targets: progressCircle,
        strokeDashoffset: offset,
        duration: 1000,
        easing: 'easeOutQuad'
    });
    
    // Update text
    progressText.textContent = percentage + '%';
}

// Breathing exercise functionality
function initializeBreathingExercise() {
    const startButton = document.getElementById('startBreathing');
    if (startButton) {
        startButton.addEventListener('click', startBreathingSession);
    }
}

function startBreathing() {
    document.getElementById('breathingModal').classList.remove('hidden');
}

function closeBreathing() {
    document.getElementById('breathingModal').classList.add('hidden');
    stopBreathingSession();
}

function setBreathingDuration(seconds) {
    breathingDuration = seconds;
    
    // Update button states
    document.querySelectorAll('#breathingModal button').forEach(btn => {
        btn.classList.remove('bg-green-100', 'text-green-700');
        btn.classList.add('bg-gray-100');
    });
    
    // Highlight selected duration
    event.target.classList.remove('bg-gray-100');
    event.target.classList.add('bg-green-100', 'text-green-700');
}

function startBreathingSession() {
    const breathingCircle = document.getElementById('breathingCircle');
    const breathingText = document.getElementById('breathingText');
    const startButton = document.getElementById('startBreathing');
    
    if (!breathingCircle || !breathingText) return;
    
    let timeLeft = breathingDuration;
    let isBreathingIn = true;
    
    // Update button text
    startButton.textContent = 'Stop';
    startButton.onclick = stopBreathingSession;
    
    // Start breathing animation
    function breathingAnimation() {
        if (isBreathingIn) {
            breathingText.textContent = 'Breathe In';
            anime({
                targets: breathingCircle,
                scale: 1.3,
                duration: 4000,
                easing: 'easeInOutQuad',
                complete: () => {
                    isBreathingIn = false;
                    setTimeout(breathingAnimation, 500);
                }
            });
        } else {
            breathingText.textContent = 'Breathe Out';
            anime({
                targets: breathingCircle,
                scale: 1,
                duration: 4000,
                easing: 'easeInOutQuad',
                complete: () => {
                    isBreathingIn = true;
                    setTimeout(breathingAnimation, 500);
                }
            });
        }
    }
    
    breathingAnimation();
    
    // Countdown timer
    breathingTimer = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 0) {
            stopBreathingSession();
            showSuccessMessage('Great job! Session completed! 🧘‍♀️');
        }
    }, 1000);
}

function stopBreathingSession() {
    const breathingCircle = document.getElementById('breathingCircle');
    const breathingText = document.getElementById('breathingText');
    const startButton = document.getElementById('startBreathing');
    
    if (breathingTimer) {
        clearInterval(breathingTimer);
        breathingTimer = null;
    }
    
    // Reset UI
    if (breathingText) breathingText.textContent = 'Breathe In';
    if (breathingCircle) {
        anime({
            targets: breathingCircle,
            scale: 1,
            duration: 500,
            easing: 'easeOutQuad'
        });
    }
    
    if (startButton) {
        startButton.textContent = 'Start';
        startButton.onclick = startBreathingSession;
    }
}

// Entrance animations
function addEntranceAnimations() {
    // Animate cards on page load
    const cards = document.querySelectorAll('.card-hover, .program-card, .setting-item');
    
    anime({
        targets: cards,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(100),
        easing: 'easeOutQuad'
    });
    
    // Animate navigation
    const navItems = document.querySelectorAll('nav a');
    anime({
        targets: navItems,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(50, {start: 300}),
        easing: 'easeOutQuad'
    });
}

// Utility functions
function showSuccessMessage(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    anime({
        targets: notification,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        anime({
            targets: notification,
            translateY: [0, -20],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuad',
            complete: () => {
                document.body.removeChild(notification);
            }
        });
    }, 3000);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause any animations or timers
        if (breathingTimer) {
            stopBreathingSession();
        }
    } else {
        // Page is visible, resume updates
        updateMoodStatus();
        updateProgressRing();
        if (document.getElementById('moodChart')) {
            initializeMoodChart();
        }
    }
});

// Export functions for global access
window.startBreathing = startBreathing;
window.closeBreathing = closeBreathing;
window.setBreathingDuration = setBreathingDuration;
window.startBreathingSession = startBreathingSession;