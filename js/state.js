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
            FILTERS: 'jobportal_filters',
            SAVED_JOBS: 'jobportal_saved_jobs',
            THEME: 'jobportal_theme'
        };
        
        this.defaultFilters = {
            search: '',
            sort: 'newest',
            remoteOnly: false,
            category: '',
            location: ''
        };

        this.itemsPerPage = 9;
        this.currentPage = 1;

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

        // Load saved jobs (for job seekers)
        this.savedJobs = this.getFromStorage(this.storageKeys.SAVED_JOBS) || [];

        // Load theme
        this.theme = this.getFromStorage(this.storageKeys.THEME) || 'light';
        
        // Load filters
        this.filters = { ...this.defaultFilters, ...this.getFromStorage(this.storageKeys.FILTERS) };
        this.currentPage = 1;
        
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
     * Set theme (light or dark)
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            return;
        }
        this.theme = theme;
        this.saveToStorage(this.storageKeys.THEME, theme);
        this.emit('themeChanged', theme);
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.theme;
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
        let updatedJob = null;
        // Update in user jobs
        const userJobIndex = this.userJobs.findIndex(job => job.id === jobId);
        if (userJobIndex !== -1) {
            updatedJob = {
                ...this.userJobs[userJobIndex],
                ...updatedData,
                updated_at: new Date().toISOString()
            };
            this.userJobs[userJobIndex] = updatedJob;
            this.saveToStorage(this.storageKeys.USER_JOBS, this.userJobs);
        }

        // Update in all jobs
        const allJobIndex = this.allJobs.findIndex(job => job.id === jobId);
        if (allJobIndex !== -1) {
            this.allJobs[allJobIndex] = updatedJob || {
                ...this.allJobs[allJobIndex],
                ...updatedData,
                updated_at: new Date().toISOString()
            };
            if (!updatedJob) updatedJob = this.allJobs[allJobIndex];
        }

        this.applyFilters();
        this.emit('jobUpdated', updatedJob);
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
    applyForJob(jobId, applicantDetails) {
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
            status: 'pending',
            ...applicantDetails // Add name, email, coverLetter
        };

        this.applications.push(application);
        this.saveToStorage(this.storageKeys.APPLICATIONS, this.applications);
        
        this.emit('applicationSubmitted', application);
        return application;
    }

    /**
     * Save a job (for job seekers)
     */
    saveJob(jobId) {
        if (!this.isJobSaved(jobId)) {
            this.savedJobs.push(jobId);
            this.saveToStorage(this.storageKeys.SAVED_JOBS, this.savedJobs);
            this.emit('jobSaved', jobId);
        }
    }

    /**
     * Unsave a job (for job seekers)
     */
    unsaveJob(jobId) {
        const index = this.savedJobs.indexOf(jobId);
        if (index > -1) {
            this.savedJobs.splice(index, 1);
            this.saveToStorage(this.storageKeys.SAVED_JOBS, this.savedJobs);
            this.emit('jobUnsaved', jobId);
        }
    }

    /**
     * Check if a job is saved
     */
    isJobSaved(jobId) {
        return this.savedJobs.includes(jobId);
    }

    /**
     * Get all saved job objects
     */
    getSavedJobs() {
        if (this.savedJobs.length === 0) return [];
        
        const savedJobsSet = new Set(this.savedJobs);
        return this.allJobs
            .filter(job => savedJobsSet.has(job.id))
            .sort((a, b) => this.savedJobs.indexOf(b.id) - this.savedJobs.indexOf(a.id)); // Keep saved order
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
     * Get applications for a specific job
     */
    getApplicationsForJob(jobId) {
        return this.applications.filter(app => app.jobId === jobId);
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
     * Set the current page for pagination
     */
    setPage(page) {
        const info = this.getPaginationInfo();
        const newPage = Math.max(1, Math.min(page, info.totalPages));

        if (this.currentPage !== newPage) {
            this.currentPage = newPage;
            this.emit('pageChanged', this.getPaginationInfo());
        }
    }

    /**
     * Get jobs for the current page
     */
    getPaginatedJobs() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.filteredJobs.slice(start, end);
    }

    /**
     * Get pagination information
     */
    getPaginationInfo() {
        const totalItems = this.filteredJobs.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        return {
            currentPage: this.currentPage,
            totalPages,
            totalItems,
            hasPrevPage: this.currentPage > 1,
            hasNextPage: this.currentPage < totalPages,
        };
    }

    /**
     * Set filters
     */
    setFilters(newFilters) {
        this.currentPage = 1;
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
        this.currentPage = 1;
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
            userJobs: this.userJobs.length,
            savedJobs: this.savedJobs.length
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
            savedJobs: this.savedJobs,
            theme: this.theme,
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
            if (data.theme) this.setTheme(data.theme);
            if (data.applications) {
                this.applications = data.applications;
                this.saveToStorage(this.storageKeys.APPLICATIONS, this.applications);
            }
            if (data.userJobs) {
                this.userJobs = data.userJobs;
                this.saveToStorage(this.storageKeys.USER_JOBS, this.userJobs);
            }
            if (data.savedJobs) {
                this.savedJobs = data.savedJobs;
                this.saveToStorage(this.storageKeys.SAVED_JOBS, this.savedJobs);
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
