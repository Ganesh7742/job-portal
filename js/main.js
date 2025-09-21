/**
 * Main Application Entry Point
 * Initializes and coordinates all modules of the Job Portal
 */

class JobPortalApp {
    constructor() {
        this.api = null;
        this.state = null;
        this.ui = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Job Portal...');
            
            // Initialize core modules
            this.api = new JobAPI();
            this.state = new JobPortalState();
            this.ui = new JobPortalUI(this.state);

            // Setup global error handling
            this.setupErrorHandling();

            // Load initial data
            await this.loadInitialData();

            // Initialize UI
            this.ui.init();

            // Mark as initialized
            this.isInitialized = true;

            console.log('✅ Job Portal initialized successfully');
            
            // Optional: Show welcome notification
            if (this.state.getUserRole() === 'job_seeker') {
                this.ui.showNotification('Welcome to Job Portal! Start browsing jobs or switch to Recruiter mode to post jobs.', 'info');
            } else {
                this.ui.showNotification('Welcome Recruiter! You can post new jobs or manage existing ones.', 'info');
            }

        } catch (error) {
            console.error('❌ Failed to initialize Job Portal:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Load initial job data from API
     */
    async loadInitialData() {
        try {
            console.log('📡 Loading jobs from API...');
            this.ui.showLoading();

            // Fetch jobs from API
            const apiJobs = await this.api.fetchJobs();
            console.log(`📥 Loaded ${apiJobs.length} jobs from API`);

            // Merge with user-created jobs
            const userJobs = this.state.getUserJobs();
            const allJobs = [...apiJobs, ...userJobs];

            // Update state
            this.state.setAllJobs(allJobs);

            console.log(`📊 Total jobs available: ${allJobs.length}`);

        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            // Don't throw here - app can still work with user-created jobs
            this.ui.showNotification('Failed to load jobs from server. You can still post and manage your own jobs.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.ui.showNotification('An unexpected error occurred. Please try again.', 'error');
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            // Don't show notification for every JS error to avoid spam
        });
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        // Show fallback UI
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 3rem; color: #e53e3e;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h2>Failed to Load Job Portal</h2>
                    <p style="margin-bottom: 2rem;">There was an error initializing the application. Please refresh the page and try again.</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        <i class="fas fa-sync"></i> Reload Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Refresh job data from API
     */
    async refreshJobs() {
        try {
            console.log('🔄 Refreshing jobs...');
            this.ui.showLoading();

            // Clear API cache and fetch fresh data
            this.api.clearCache();
            const apiJobs = await this.api.fetchJobs();
            
            // Merge with user jobs
            const userJobs = this.state.getUserJobs();
            const allJobs = [...apiJobs, ...userJobs];
            
            // Update state
            this.state.setAllJobs(allJobs);
            
            this.ui.showNotification(`Refreshed! Loaded ${apiJobs.length} jobs from server.`, 'success');
            console.log(`🔄 Jobs refreshed: ${allJobs.length} total jobs`);

        } catch (error) {
            console.error('❌ Error refreshing jobs:', error);
            this.ui.showNotification('Failed to refresh jobs. Please try again later.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Export user data
     */
    exportData() {
        try {
            const data = this.state.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `job-portal-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.ui.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.ui.showNotification('Failed to export data.', 'error');
        }
    }

    /**
     * Import user data
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const success = this.state.importData(data);
                
                if (success) {
                    this.ui.showNotification('Data imported successfully!', 'success');
                    this.ui.init(); // Refresh UI
                } else {
                    this.ui.showNotification('Failed to import data. Check file format.', 'error');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.ui.showNotification('Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Clear all user data (for development/testing)
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.state.clearAllData();
            this.ui.showNotification('All data cleared successfully!', 'success');
            this.ui.init(); // Refresh UI
        }
    }

    /**
     * Get application statistics
     */
    getStats() {
        const stateStats = this.state.getStats();
        const apiStats = this.api.getStats();
        
        return {
            ...stateStats,
            ...apiStats,
            initialized: this.isInitialized,
            userRole: this.state.getUserRole()
        };
    }

    /**
     * Toggle developer mode features
     */
    toggleDevMode() {
        const devPanel = document.getElementById('dev-panel');
        if (devPanel) {
            devPanel.remove();
            return;
        }

        const stats = this.getStats();
        const panel = document.createElement('div');
        panel.id = 'dev-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #2d3748;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            font-size: 0.8rem;
            max-width: 300px;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                <strong>Developer Panel</strong>
                <button onclick="this.parentNode.parentNode.remove()" style="background:none;border:none;color:white;cursor:pointer;padding:0;margin-left:auto;">&times;</button>
            </div>
            <div><strong>Stats:</strong></div>
            <div>Total Jobs: ${stats.total}</div>
            <div>Filtered: ${stats.filteredJobs}</div>
            <div>Applications: ${stats.applications}</div>
            <div>User Jobs: ${stats.userJobs}</div>
            <div>Role: ${stats.userRole}</div>
            <div style="margin-top: 0.5rem;">
                <button onclick="app.refreshJobs()" class="btn btn-small" style="margin-right: 0.5rem; padding: 0.2rem 0.5rem; font-size: 0.7rem;">Refresh</button>
                <button onclick="app.exportData()" class="btn btn-small" style="margin-right: 0.5rem; padding: 0.2rem 0.5rem; font-size: 0.7rem;">Export</button>
                <button onclick="app.clearAllData()" class="btn btn-small" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: #f56565;">Clear</button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
}

/**
 * Create floating particles animation
 */
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random starting position
        particle.style.left = Math.random() * 100 + '%';
        
        // Random size
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Random animation duration and delay
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        particle.style.animationDuration = duration + 's';
        particle.style.animationDelay = delay + 's';
        
        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        
        particlesContainer.appendChild(particle);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Create floating particles
    createParticles();
    
    // Create global app instance
    window.app = new JobPortalApp();
    
    // Initialize the application
    await window.app.init();
    
    // Make UI globally available for inline event handlers
    window.ui = window.app.ui;
    
    // Development keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + D to toggle dev mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            window.app.toggleDevMode();
        }
        
        // Ctrl/Cmd + R to refresh jobs (prevent default browser refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
            e.preventDefault();
            window.app.refreshJobs();
        }
    });

    // Add file import handler for drag & drop
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(file => file.type === 'application/json');
        
        if (jsonFile && jsonFile.name.includes('job-portal-backup')) {
            window.app.importData(jsonFile);
        }
    });

    // Log welcome message
    console.log(`
🎯 Job Portal Application Loaded Successfully!

Developer Commands:
- Ctrl/Cmd + D: Toggle developer panel
- Ctrl/Cmd + Shift + R: Refresh jobs from API
- app.getStats(): Get application statistics
- app.refreshJobs(): Refresh job data
- app.exportData(): Export user data
- app.clearAllData(): Clear all data

Happy job hunting! 🚀
    `);
});

// Handle page visibility changes to refresh data when user returns
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app && window.app.isInitialized) {
        // Check if data is stale (older than 10 minutes)
        const lastFetch = window.app.api.lastFetch;
        const tenMinutes = 10 * 60 * 1000;
        
        if (lastFetch && (Date.now() - lastFetch) > tenMinutes) {
            console.log('🔄 Auto-refreshing stale data...');
            window.app.refreshJobs();
        }
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobPortalApp;
}
