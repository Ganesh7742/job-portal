/**
 * State Management for Job Portal
 * Handles user data, applications, and job operations with localStorage persistence
 */

class JobPortalState {
    constructor() {
        this.storageKeys = {
            USER_ROLE: 'jobportal_user_role',
            APPLICATIONS: 'jobportal_applications',
            USER_JOBS: 'jobportal_user_jobs',
            FILTERS: 'jobportal_filters'
        };
        
        this.defaultFilters = {
            search: '',
            sort: 'newest',
            remoteOnly: false,
            category: '',
            location: ''
        };

        this.eventListeners = new Map();
        this.init();
    }

    /**
     * Initialize state from localStorage
     */
    init() {
        // Load user role
        this.userRole = this.getFromStorage(this.storageKeys.USER_ROLE) || 'job_seeker';
        
        // Load applications
        this.applications = this.getFromStorage(this.storageKeys.APPLICATIONS) || [];
        
        // Load user-posted jobs (for recruiters)
        this.userJobs = this.getFromStorage(this.storageKeys.USER_JOBS) || [];
        
        // Load filters
        this.filters = { ...this.defaultFilters, ...this.getFromStorage(this.storageKeys.FILTERS) };
        
        // Initialize job data
        this.allJobs = [];
        this.filteredJobs = [];
    }

    /**
     * Get data from localStorage with error handling
     */
    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return null;
        }
    }

    /**
     * Save data to localStorage with error handling
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving to localStorage (${key}):`, error);
        }
    }

    /**
     * Add event listener for state changes
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Emit event to listeners
     */
    emit(event, data = null) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    /**
     * Set user role (job_seeker or recruiter)
     */
    setUserRole(role) {
        if (role !== 'job_seeker' && role !== 'recruiter') {
            throw new Error('Invalid role. Must be "job_seeker" or "recruiter"');
        }
        
        this.userRole = role;
        this.saveToStorage(this.storageKeys.USER_ROLE, role);
        this.emit('roleChanged', role);
    }

    /**
     * Get current user role
     */
    getUserRole() {
        return this.userRole;
    }


    /**
     * Set all jobs data (from API)
     */
    setAllJobs(jobs) {
        this.allJobs = jobs || [];
        this.applyFilters();
        this.emit('jobsUpdated', this.filteredJobs);
    }

    /**
     * Get all jobs
     */
    getAllJobs() {
        return this.allJobs;
    }

    /**
     * Get filtered jobs
     */
    getFilteredJobs() {
        return this.filteredJobs;
    }

    /**
     * Add a new job (for recruiters)
     */
    addJob(jobData) {
        const job = {
            id: `user_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...jobData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source: 'user'
        };

        this.userJobs.push(job);
        this.allJobs.push(job);
        this.saveToStorage(this.storageKeys.USER_JOBS, this.userJobs);
        
        this.applyFilters();
        this.emit('jobAdded', job);
        this.emit('jobsUpdated', this.filteredJobs);
        
        return job;
    }

    /**
     * Update an existing job (for recruiters)
     */
    updateJob(jobId, updatedData) {
        // Update in user jobs
        const userJobIndex = this.userJobs.findIndex(job => job.id === jobId);
        if (userJobIndex !== -1) {
            this.userJobs[userJobIndex] = {
                ...this.userJobs[userJobIndex],
                ...updatedData,
                updated_at: new Date().toISOString()
            };
            this.saveToStorage(this.storageKeys.USER_JOBS, this.userJobs);
        }

        // Update in all jobs
        const allJobIndex = this.allJobs.findIndex(job => job.id === jobId);
        if (allJobIndex !== -1) {
            this.allJobs[allJobIndex] = {
                ...this.allJobs[allJobIndex],
                ...updatedData,
                updated_at: new Date().toISOString()
            };
        }

        this.applyFilters();
        this.emit('jobUpdated', jobId);
        this.emit('jobsUpdated', this.filteredJobs);
    }

    /**
     * Delete a job (for recruiters)
     */
    deleteJob(jobId) {
        // Remove from user jobs
        this.userJobs = this.userJobs.filter(job => job.id !== jobId);
        this.saveToStorage(this.storageKeys.USER_JOBS, this.userJobs);

        // Remove from all jobs
        this.allJobs = this.allJobs.filter(job => job.id !== jobId);

        this.applyFilters();
        this.emit('jobDeleted', jobId);
        this.emit('jobsUpdated', this.filteredJobs);
    }

    /**
     * Get user's posted jobs (for recruiters)
     */
    getUserJobs() {
        return this.userJobs;
    }

    /**
     * Apply for a job (for job seekers)
     */
    applyForJob(jobId) {
        // Check if already applied
        if (this.hasApplied(jobId)) {
            throw new Error('You have already applied for this job');
        }

        const job = this.allJobs.find(j => j.id === jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        const application = {
            id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jobId: jobId,
            jobTitle: job.title,
            company: job.company,
            appliedAt: new Date().toISOString(),
            status: 'pending'
        };

        this.applications.push(application);
        this.saveToStorage(this.storageKeys.APPLICATIONS, this.applications);
        
        this.emit('applicationSubmitted', application);
        return application;
    }

    /**
     * Check if user has applied for a job
     */
    hasApplied(jobId) {
        return this.applications.some(app => app.jobId === jobId);
    }

    /**
     * Get user's applications
     */
    getApplications() {
        return this.applications;
    }

    /**
     * Update application status
     */
    updateApplicationStatus(applicationId, status) {
        const appIndex = this.applications.findIndex(app => app.id === applicationId);
        if (appIndex !== -1) {
            this.applications[appIndex].status = status;
            this.saveToStorage(this.storageKeys.APPLICATIONS, this.applications);
            this.emit('applicationUpdated', this.applications[appIndex]);
        }
    }

    /**
     * Set filters
     */
    setFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        this.saveToStorage(this.storageKeys.FILTERS, this.filters);
        this.applyFilters();
        this.emit('filtersChanged', this.filters);
        this.emit('jobsUpdated', this.filteredJobs);
    }

    /**
     * Get current filters
     */
    getFilters() {
        return this.filters;
    }

    /**
     * Reset filters to default
     */
    resetFilters() {
        this.filters = { ...this.defaultFilters };
        this.saveToStorage(this.storageKeys.FILTERS, this.filters);
        this.applyFilters();
        this.emit('filtersChanged', this.filters);
        this.emit('jobsUpdated', this.filteredJobs);
    }

    /**
     * Apply current filters and sorting to jobs
     */
    applyFilters() {
        let filtered = [...this.allJobs];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply remote filter
        if (this.filters.remoteOnly) {
            filtered = filtered.filter(job => job.is_remote_work);
        }

        // Apply category filter
        if (this.filters.category) {
            filtered = filtered.filter(job => job.job_category === this.filters.category);
        }

        // Apply location filter
        if (this.filters.location) {
            filtered = filtered.filter(job => 
                job.location.toLowerCase().includes(this.filters.location.toLowerCase())
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.filters.sort) {
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'salary_high':
                    const avgSalaryA = a.salary_from && a.salary_to 
                        ? (a.salary_from + a.salary_to) / 2 
                        : 0;
                    const avgSalaryB = b.salary_from && b.salary_to 
                        ? (b.salary_from + b.salary_to) / 2 
                        : 0;
                    return avgSalaryB - avgSalaryA;
                case 'salary_low':
                    const avgSalaryA2 = a.salary_from && a.salary_to 
                        ? (a.salary_from + a.salary_to) / 2 
                        : Infinity;
                    const avgSalaryB2 = b.salary_from && b.salary_to 
                        ? (b.salary_from + b.salary_to) / 2 
                        : Infinity;
                    return avgSalaryA2 - avgSalaryB2;
                case 'newest':
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        this.filteredJobs = filtered;
    }

    /**
     * Get job by ID
     */
    getJobById(jobId) {
        return this.allJobs.find(job => job.id === jobId);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalJobs: this.allJobs.length,
            filteredJobs: this.filteredJobs.length,
            applications: this.applications.length,
            userJobs: this.userJobs.length
        };
    }

    /**
     * Clear all data (for development/testing)
     */
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
        this.emit('dataCleared');
    }

    /**
     * Export user data (for backup)
     */
    exportData() {
        return {
            userRole: this.userRole,
            applications: this.applications,
            userJobs: this.userJobs,
            filters: this.filters,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import user data (from backup)
     */
    importData(data) {
        try {
            if (data.userRole) this.setUserRole(data.userRole);
            if (data.applications) {
                this.applications = data.applications;
                this.saveToStorage(this.storageKeys.APPLICATIONS, this.applications);
            }
            if (data.userJobs) {
                this.userJobs = data.userJobs;
                this.saveToStorage(this.storageKeys.USER_JOBS, this.userJobs);
            }
            if (data.filters) {
                this.filters = { ...this.defaultFilters, ...data.filters };
                this.saveToStorage(this.storageKeys.FILTERS, this.filters);
            }
            
            this.emit('dataImported', data);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.JobPortalState = JobPortalState;
