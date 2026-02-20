// MentalSpace API Client
// Handles all communication with the backend API

class MentalSpaceAPI {
    constructor() {
        // Get configuration from global window object or use defaults
        const config = window.MENTALSPACE_CONFIG || {
            API_BASE_URL: 'http://localhost:3001',
            NODE_ENV: 'development'
        };
        
        this.baseURL = config.API_BASE_URL || 'http://localhost:3001';
        this.token = localStorage.getItem('mentalspace_token');
        this.socket = null;
    }

    // Authentication
    async login(email, password) {
        try {
            const response = await this.request('/api/auth/login', 'POST', { email, password });
            if (response.token) {
                this.token = response.token;
                localStorage.setItem('mentalspace_token', this.token);
            }
            return response;
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async register(userData) {
        try {
            const response = await this.request('/api/auth/register', 'POST', userData);
            if (response.token) {
                this.token = response.token;
                localStorage.setItem('mentalspace_token', this.token);
            }
            return response;
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    }

    async logout() {
        try {
            await this.request('/api/auth/logout', 'POST');
        } finally {
            this.token = null;
            localStorage.removeItem('mentalspace_token');
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
        }
    }

    // User Profile
    async getProfile() {
        return this.request('/api/users/profile');
    }

    async updateProfile(profileData) {
        return this.request('/api/users/profile', 'PUT', profileData);
    }

    // Mood Tracking
    async getMoodHistory(limit = 30, offset = 0) {
        return this.request(`/api/moods?limit=${limit}&offset=${offset}`);
    }

    async createMoodEntry(moodData) {
        return this.request('/api/moods', 'POST', moodData);
    }

    async getMoodStats(period = '30days') {
        return this.request(`/api/moods/stats?period=${period}`);
    }

    async getMoodInsights(days = 30) {
        return this.request(`/api/moods/insights?days=${days}`);
    }

    async deleteMoodEntry(id) {
        return this.request(`/api/moods/${id}`, 'DELETE');
    }

    // Programs
    async getPrograms() {
        return this.request('/api/programs');
    }

    async getProgram(id) {
        return this.request(`/api/programs/${id}`);
    }

    async enrollInProgram(programId) {
        return this.request(`/api/programs/${programId}/enroll`, 'POST');
    }

    async getUserPrograms() {
        return this.request('/api/programs/user/progress');
    }

    async completeModule(moduleId, completionData = {}) {
        return this.request(`/api/programs/modules/${moduleId}/complete`, 'POST', completionData);
    }

    async getProgramRecommendations() {
        return this.request('/api/programs/recommendations');
    }

    // Chat
    async getChatSessions() {
        return this.request('/api/chat/sessions');
    }

    async createChatSession(sessionData) {
        return this.request('/api/chat/sessions', 'POST', sessionData);
    }

    async getChatMessages(sessionId, limit = 50) {
        return this.request(`/api/chat/sessions/${sessionId}/messages?limit=${limit}`);
    }

    async sendChatMessage(sessionId, messageData) {
        return this.request(`/api/chat/sessions/${sessionId}/messages`, 'POST', messageData);
    }

    async rateChatSession(sessionId, rating, feedback) {
        return this.request(`/api/chat/sessions/${sessionId}/rate`, 'PUT', { rating, feedback });
    }

    async endChatSession(sessionId) {
        return this.request(`/api/chat/sessions/${sessionId}/end`, 'PUT');
    }

    async getAvailableCounselors() {
        return this.request('/api/chat/counselors/available');
    }

    // Breathing Exercises
    async getBreathingSessions(limit = 30, offset = 0) {
        return this.request(`/api/breathing?limit=${limit}&offset=${offset}`);
    }

    async createBreathingSession(sessionData) {
        return this.request('/api/breathing', 'POST', sessionData);
    }

    async getBreathingStats(days = 30) {
        return this.request(`/api/breathing/stats?days=${days}`);
    }

    // Achievements
    async getAchievements() {
        return this.request('/api/achievements');
    }

    async getUserAchievements() {
        return this.request('/api/achievements/user');
    }

    async getAchievementProgress() {
        return this.request('/api/achievements/progress');
    }

    // Socket.io for real-time chat
    connectSocket() {
        if (this.socket) {
            return this.socket;
        }

        if (!this.token) {
            throw new Error('No authentication token available');
        }

        this.socket = io(this.baseURL, {
            auth: {
                token: this.token
            }
        });

        return this.socket;
    }

    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Helper method for making API requests
    async request(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add authentication token if available
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add request body for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.message || 'Request failed');
        }

        return response.json();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Get current user token
    getToken() {
        return this.token;
    }

    // Set new token
    setToken(token) {
        this.token = token;
        localStorage.setItem('mentalspace_token', token);
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        localStorage.removeItem('mentalspace_token');
        this.disconnectSocket();
    }
}

// Create and export singleton instance
const api = new MentalSpaceAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}

// Make globally available in browser
if (typeof window !== 'undefined') {
    window.MentalSpaceAPI = api;
}