// MentalSpace - Main JavaScript Functionality with Backend Integration
// Handles mood tracking, breathing exercises, progress tracking, and API communication

// Import API client (will be available globally in browser)
let api;
if (typeof module !== 'undefined' && module.exports) {
    api = require('./api');
} else {
    api = window.MentalSpaceAPI;
}

// Get API configuration from server
const API_CONFIG = window.MENTALSPACE_CONFIG || {
    API_BASE_URL: 'http://localhost:3001',
    NODE_ENV: 'development'
};

// Global state management
let currentMood = null;
let moodHistory = [];
let breathingTimer = null;
let breathingDuration = 180; // Default 3 minutes
let currentUser = null;
let socket = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Check if user is authenticated
        if (api.isAuthenticated()) {
            await loadUserData();
        } else {
            // Redirect to login or show login modal
            showLoginPrompt();
        }

        // Create floating particles
        createFloatingParticles();
        
        // Initialize mood chart if on index page
        if (document.getElementById('moodChart')) {
            await loadMoodHistory();
            initializeMoodChart();
            updateProgressRing();
        }
        
        // Initialize mood selector
        initializeMoodSelector();
        
        // Initialize breathing exercise
        initializeBreathingExercise();
        
        // Initialize real-time chat if on chat page
        if (window.location.pathname.includes('chat.html')) {
            initializeRealTimeChat();
        }
        
        // Add entrance animations
        addEntranceAnimations();
        
    } catch (error) {
        console.error('App initialization error:', error);
        showErrorMessage('Failed to load application data');
    }
}

async function loadUserData() {
    try {
        currentUser = await api.getProfile();
        updateUserInterface();
    } catch (error) {
        console.error('Failed to load user data:', error);
        if (error.message.includes('Unauthorized')) {
            api.clearAuth();
            showLoginPrompt();
        }
    }
}

function updateUserInterface() {
    if (!currentUser) return;
    
    // Update user name in interface
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = currentUser.firstName || 'User';
    });
    
    // Update profile picture if available
    if (currentUser.avatar) {
        const avatarElements = document.querySelectorAll('.user-avatar');
        avatarElements.forEach(element => {
            element.style.backgroundImage = `url(${currentUser.avatar})`;
        });
    }
}

function showLoginPrompt() {
    // Create login modal or redirect to login page
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold mb-4 text-center">Welcome to MentalSpace</h2>
            <p class="text-gray-600 mb-6 text-center">Please log in to continue</p>
            <div class="space-y-4">
                <input type="email" id="loginEmail" placeholder="Email" class="w-full p-3 border rounded-lg">
                <input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 border rounded-lg">
                <button onclick="handleLogin()" class="w-full bg-gradient-to-r from-green-400 to-purple-400 text-white py-3 rounded-lg font-medium">
                    Login
                </button>
                <button onclick="handleRegister()" class="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium">
                    Create Account
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showErrorMessage('Please enter both email and password');
        return;
    }
    
    try {
        const response = await api.login(email, password);
        showSuccessMessage('Login successful!');
        
        // Remove login modal
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) modal.remove();
        
        // Reload app data
        await loadUserData();
        
    } catch (error) {
        showErrorMessage(error.message || 'Login failed');
    }
}

async function handleRegister() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showErrorMessage('Please enter both email and password');
        return;
    }
    
    // For demo purposes, use a simple registration
    // In production, you'd want a proper registration form
    try {
        const response = await api.register({
            email,
            password,
            firstName: 'User',
            lastName: 'MentalSpace'
        });
        showSuccessMessage('Registration successful!');
        
        // Remove login modal
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) modal.remove();
        
        // Reload app data
        await loadUserData();
        
    } catch (error) {
        showErrorMessage(error.message || 'Registration failed');
    }
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

async function loadMoodHistory() {
    try {
        const response = await api.getMoodHistory();
        moodHistory = response.moods || [];
        updateMoodStatus();
    } catch (error) {
        console.error('Failed to load mood history:', error);
        // Fallback to localStorage if API fails
        moodHistory = JSON.parse(localStorage.getItem('moodHistory')) || [];
    }
}

async function submitMoodCheckIn() {
    if (!currentMood) {
        alert('Please select how you\'re feeling first!');
        return;
    }
    
    if (!api.isAuthenticated()) {
        showLoginPrompt();
        return;
    }
    
    const moodNote = document.getElementById('moodNote');
    const note = moodNote ? moodNote.value : '';
    
    // Save mood data
    const moodEntry = {
        mood: currentMood,
        note: note,
        date: new Date().toISOString().split('T')[0]
    };
    
    try {
        // Save to backend
        await api.createMoodEntry(moodEntry);
        
        // Also save to localStorage for offline access
        moodHistory = moodHistory.filter(entry => entry.date !== moodEntry.date);
        moodHistory.push(moodEntry);
        localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
        
        // Update UI
        updateMoodStatus();
        updateProgressRing();
        
        // Refresh mood chart if visible
        if (document.getElementById('moodChart')) {
            await loadMoodHistory();
            initializeMoodChart();
        }
        
        // Show success message
        showSuccessMessage('Mood check-in saved! 🌟');
        
        // Reset form
        document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('selected'));
        if (moodNote) moodNote.value = '';
        currentMood = null;
        
    } catch (error) {
        console.error('Failed to save mood entry:', error);
        showErrorMessage('Failed to save mood check-in');
    }
}

function updateMoodStatus() {
    const moodStatus = document.getElementById('moodStatus');
    if (moodStatus) {
        const today = new Date().toDateString();
        const todayEntry = moodHistory.find(entry => new Date(entry.date).toDateString() === today);
        
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
        const dateStr = date.toISOString().split('T')[0];
        
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
    const todayMood = moodHistory.find(entry => new Date(entry.date).toDateString() === today);
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

async function startBreathingSession() {
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
    breathingTimer = setInterval(async () => {
        timeLeft--;
        
        if (timeLeft <= 0) {
            await stopBreathingSession();
            showSuccessMessage('Great job! Session completed! 🧘‍♀️');
            
            // Save breathing session to backend
            try {
                await api.createBreathingSession({
                    duration: breathingDuration,
                    technique: 'box'
                });
            } catch (error) {
                console.error('Failed to save breathing session:', error);
            }
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

// Real-time chat initialization
function initializeRealTimeChat() {
    if (!api.isAuthenticated()) return;
    
    try {
        socket = api.connectSocket();
        
        socket.on('connect', () => {
            console.log('Connected to chat server');
        });
        
        socket.on('chat:message', (data) => {
            // Handle incoming messages
            displayNewMessage(data);
        });
        
        socket.on('chat:typing', (data) => {
            // Handle typing indicators
            updateTypingIndicator(data);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
        });
        
    } catch (error) {
        console.error('Failed to connect to chat server:', error);
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

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
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
        if (api.isAuthenticated()) {
            updateMoodStatus();
            updateProgressRing();
            if (document.getElementById('moodChart')) {
                loadMoodHistory().then(() => {
                    initializeMoodChart();
                });
            }
        }
    }
});

// Export functions for global access
if (typeof window !== 'undefined') {
    window.startBreathing = startBreathing;
    window.closeBreathing = closeBreathing;
    window.setBreathingDuration = setBreathingDuration;
    window.startBreathingSession = startBreathingSession;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
}