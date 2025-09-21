/**
 * UI Controller for Job Portal
 * Handles all UI rendering, interactions, and DOM manipulation
 */

class JobPortalUI {
    constructor(state) {
        this.state = state;
        this.currentView = 'jobs';
        this.modal = null;
        this.setupEventListeners();
        this.setupStateListeners();
    }

    /**
     * Initialize the UI
     */
    init() {
        this.updateRoleUI();
        this.setupFilters();
        this.showView('jobs');
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Role toggle
        const roleSelect = document.getElementById('role-select');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                this.state.setUserRole(e.target.value);
            });
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = btn.dataset.view;
                if (view) {
                    this.showView(view);
                    this.closeMobileMenu();
                }
            });
        });

        // Search and filters
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.state.setFilters({ search: e.target.value });
                }, 300);
            });
        }

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.state.setFilters({ sort: e.target.value });
            });
        }

        const remoteFilter = document.getElementById('remote-filter');
        if (remoteFilter) {
            remoteFilter.addEventListener('change', (e) => {
                this.state.setFilters({ remoteOnly: e.target.checked });
            });
        }

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.state.setFilters({ category: e.target.value });
            });
        }

        const locationFilter = document.getElementById('location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.state.setFilters({ location: e.target.value });
            });
        }

        // Job form submission
        const jobForm = document.getElementById('job-form');
        if (jobForm) {
            jobForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleJobSubmission();
            });
        }

        // Modal close
        const closeModal = document.getElementById('close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Modal backdrop click
        this.modal = document.getElementById('job-modal');
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    /**
     * Setup state change listeners
     */
    setupStateListeners() {
        this.state.addEventListener('roleChanged', (role) => {
            this.updateRoleUI();
        });

        this.state.addEventListener('jobsUpdated', (jobs) => {
            if (this.currentView === 'jobs') {
                this.renderJobsGrid(jobs);
            }
        });

        this.state.addEventListener('applicationSubmitted', (application) => {
            this.showNotification('Application submitted successfully!', 'success');
        });

        this.state.addEventListener('jobAdded', (job) => {
            this.showNotification('Job posted successfully!', 'success');
            this.clearJobForm();
        });

        this.state.addEventListener('jobDeleted', (jobId) => {
            this.showNotification('Job deleted successfully!', 'success');
        });

    }

    /**
     * Update UI based on user role
     */
    updateRoleUI() {
        const role = this.state.getUserRole();
        const roleSelect = document.getElementById('role-select');
        
        if (roleSelect) {
            roleSelect.value = role;
        }

        // Show/hide navigation buttons based on role
        const applicationsNav = document.getElementById('applications-nav');
        const postJobNav = document.getElementById('post-job-nav');
        const manageJobsNav = document.getElementById('manage-jobs-nav');

        if (role === 'job_seeker') {
            if (applicationsNav) applicationsNav.style.display = 'flex';
            if (postJobNav) postJobNav.style.display = 'none';
            if (manageJobsNav) manageJobsNav.style.display = 'none';
        } else if (role === 'recruiter') {
            if (applicationsNav) applicationsNav.style.display = 'none';
            if (postJobNav) postJobNav.style.display = 'flex';
            if (manageJobsNav) manageJobsNav.style.display = 'flex';
        }

        // Switch to jobs view if current view is no longer available
        if ((role === 'job_seeker' && ['post-job', 'manage-jobs'].includes(this.currentView)) ||
            (role === 'recruiter' && this.currentView === 'applications')) {
            this.showView('jobs');
        }
    }

    /**
     * Setup filter controls with current state
     */
    setupFilters() {
        const filters = this.state.getFilters();
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = filters.search;

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = filters.sort;

        const remoteFilter = document.getElementById('remote-filter');
        if (remoteFilter) remoteFilter.checked = filters.remoteOnly;

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) categoryFilter.value = filters.category;
        
        const locationFilter = document.getElementById('location-filter');
        if (locationFilter) locationFilter.value = filters.location;
    }

    /**
     * Show a specific view
     */
    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeNavBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }

        this.currentView = viewName;

        // Load view-specific content
        switch (viewName) {
            case 'jobs':
                this.renderJobsGrid(this.state.getFilteredJobs());
                this.updateCategoryFilter();
                this.updateLocationFilter();
                break;
            case 'applications':
                this.renderApplicationsList();
                break;
            case 'post-job':
                const deadlineInput = document.getElementById('job-deadline');
                if (deadlineInput) {
                    // Set min date to today to prevent selecting past dates
                    deadlineInput.min = new Date().toISOString().split('T')[0];
                }
                break;
            case 'manage-jobs':
                this.renderManageJobsList();
                break;
        }
    }

    /**
     * Update category filter with available categories
     */
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        // Get unique categories from all jobs
        const categories = new Set();
        this.state.getAllJobs().forEach(job => {
            if (job.job_category) {
                categories.add(job.job_category);
            }
        });

        // Clear existing options (except "All Categories")
        const firstOption = categoryFilter.firstElementChild;
        categoryFilter.innerHTML = '';
        categoryFilter.appendChild(firstOption);

        // Add category options
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Restore selected value
        const filters = this.state.getFilters();
        categoryFilter.value = filters.category;
    }

    /**
     * Render jobs grid
     */
    renderJobsGrid(jobs) {
        const jobsGrid = document.getElementById('jobs-grid');
        if (!jobsGrid) return;

        if (!jobs || jobs.length === 0) {
            jobsGrid.innerHTML = this.getEmptyState('No jobs found', 'briefcase');
            return;
        }

        jobsGrid.innerHTML = jobs.map(job => this.createJobCard(job)).join('');
    }

    /**
     * Create a job card HTML
     */
    createJobCard(job) {
        const hasApplied = this.state.hasApplied(job.id);
        const userRole = this.state.getUserRole();
        const salaryText = job.salary_from && job.salary_to 
            ? `$${job.salary_from.toLocaleString()} - $${job.salary_to.toLocaleString()}`
            : 'Salary not specified';

        const deadlineText = job.application_deadline 
            ? new Date(job.application_deadline).toLocaleDateString()
            : 'No deadline specified';

        return `
            <div class="job-card" data-job-id="${job.id}">
                <div class="job-header">
                    <h3 class="job-title">${this.escapeHtml(job.title)}</h3>
                    <p class="job-company">${this.escapeHtml(job.company)}</p>
                    <p class="job-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${this.escapeHtml(job.location)}
                    </p>
                </div>
                
                <div class="job-meta">
                    <span class="job-tag">${this.escapeHtml(job.employment_type)}</span>
                    ${job.is_remote_work ? '<span class="job-tag remote">Remote</span>' : ''}
                    <span class="job-tag salary">${salaryText}</span>
                </div>

                <p class="job-description">${this.escapeHtml(job.description)}</p>

                <div class="job-actions">
                    <button class="btn btn-secondary btn-small" onclick="ui.showJobDetails('${job.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${userRole === 'job_seeker' ? `
                        <button class="btn ${hasApplied ? 'btn-secondary' : 'btn-primary'} btn-small" 
                                ${hasApplied ? 'disabled' : `onclick="ui.applyForJob('${job.id}')"`}>
                            <i class="fas ${hasApplied ? 'fa-check' : 'fa-paper-plane'}"></i>
                            ${hasApplied ? 'Applied' : 'Apply Now'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Show job details in modal
     */
    showJobDetails(jobId) {
        const job = this.state.getJobById(jobId);
        if (!job) return;

        const hasApplied = this.state.hasApplied(jobId);
        const userRole = this.state.getUserRole();
        const salaryText = job.salary_from && job.salary_to 
            ? `$${job.salary_from.toLocaleString()} - $${job.salary_to.toLocaleString()}`
            : 'Salary not specified';

        const deadlineText = job.application_deadline 
            ? new Date(job.application_deadline).toLocaleDateString()
            : 'No deadline specified';

        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${this.escapeHtml(job.title)}</h2>
                <p class="modal-subtitle">${this.escapeHtml(job.company)}</p>
                <p class="modal-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${this.escapeHtml(job.location)}
                </p>
            </div>

            <div class="modal-meta">
                <span class="job-tag">${this.escapeHtml(job.employment_type)}</span>
                ${job.is_remote_work ? '<span class="job-tag remote">Remote Work</span>' : ''}
                <span class="job-tag salary">${salaryText}</span>
                <span class="job-tag">${job.number_of_opening} opening${job.number_of_opening > 1 ? 's' : ''}</span>
            </div>

            <div class="modal-section">
                <h4>Job Description</h4>
                <p>${this.escapeHtml(job.description)}</p>
            </div>

            ${job.qualifications && job.qualifications.length > 0 ? `
                <div class="modal-section">
                    <h4>Qualifications</h4>
                    <ul class="qualifications-list">
                        ${job.qualifications.map(qual => `<li>${this.escapeHtml(qual)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="modal-section">
                <h4>Application Details</h4>
                <p><strong>Deadline:</strong> ${deadlineText}</p>
                <p><strong>Contact:</strong> ${this.escapeHtml(job.contact)}</p>
            </div>

            ${userRole === 'job_seeker' ? `
                <div class="modal-section">
                    <button class="btn ${hasApplied ? 'btn-secondary' : 'btn-primary'}" 
                            ${hasApplied ? 'disabled' : `onclick="ui.applyForJob('${job.id}')"`}>
                        <i class="fas ${hasApplied ? 'fa-check' : 'fa-paper-plane'}"></i>
                        ${hasApplied ? 'Already Applied' : 'Apply for this Job'}
                    </button>
                </div>
            ` : ''}
        `;

        this.openModal();
    }

    /**
     * Apply for a job
     */
    applyForJob(jobId) {
        try {
            this.state.applyForJob(jobId);
            this.closeModal();
            
            // Refresh the current view to update the UI
            if (this.currentView === 'jobs') {
                this.renderJobsGrid(this.state.getFilteredJobs());
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    /**
     * Handle job form submission
     */
    handleJobSubmission() {
        const form = document.getElementById('job-form');
        if (!form) return;

        const formData = new FormData(form);
        
        // Parse qualifications
        const qualificationsText = document.getElementById('job-qualifications').value;
        const qualifications = qualificationsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const deadlineValue = document.getElementById('job-deadline').value;

        const jobData = {
            title: formData.get('title') || document.getElementById('job-title').value,
            company: document.getElementById('job-company').value,
            location: document.getElementById('job-location').value,
            salary_from: parseInt(document.getElementById('job-salary-from').value) || null,
            salary_to: parseInt(document.getElementById('job-salary-to').value) || null,
            employment_type: document.getElementById('job-type').value,
            job_category: document.getElementById('job-category').value,
            description: document.getElementById('job-description').value,
            qualifications: qualifications,
            contact: document.getElementById('job-contact').value,
            number_of_opening: parseInt(document.getElementById('job-openings').value) || 1,
            is_remote_work: document.getElementById('job-remote').checked,
            application_deadline: deadlineValue ? new Date(deadlineValue).toISOString() : null
        };

        // Validate required fields
        if (!jobData.title || !jobData.company || !jobData.location || !jobData.employment_type || 
            !jobData.job_category || !jobData.description || !jobData.contact || !jobData.application_deadline) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            this.state.addJob(jobData);
        } catch (error) {
            this.showNotification('Error posting job: ' + error.message, 'error');
        }
    }

    /**
     * Clear the job form
     */
    clearJobForm() {
        const form = document.getElementById('job-form');
        if (form) {
            form.reset();
        }
    }

    /**
     * Render applications list
     */
    renderApplicationsList() {
        const applicationsList = document.getElementById('applications-list');
        if (!applicationsList) return;

        const applications = this.state.getApplications();

        if (applications.length === 0) {
            applicationsList.innerHTML = this.getEmptyState('No applications yet', 'file-alt');
            return;
        }

        applicationsList.innerHTML = applications
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
            .map(app => this.createApplicationItem(app))
            .join('');
    }

    /**
     * Create an application item HTML
     */
    createApplicationItem(application) {
        const appliedDate = new Date(application.appliedAt).toLocaleDateString();
        const statusClass = application.status === 'pending' ? 'pending' : application.status;

        return `
            <div class="application-item">
                <div class="application-header">
                    <div class="application-info">
                        <h3>${this.escapeHtml(application.jobTitle)}</h3>
                        <p>${this.escapeHtml(application.company)}</p>
                    </div>
                    <div class="application-date">
                        Applied: ${appliedDate}
                    </div>
                </div>
                <div class="application-status">
                    <span class="status-badge status-${statusClass}">
                        ${application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Render manage jobs list for recruiters
     */
    renderManageJobsList() {
        const manageJobsList = document.getElementById('manage-jobs-list');
        if (!manageJobsList) return;

        const userJobs = this.state.getUserJobs();

        if (userJobs.length === 0) {
            manageJobsList.innerHTML = this.getEmptyState('No jobs posted yet', 'plus');
            return;
        }

        manageJobsList.innerHTML = userJobs
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(job => this.createManageJobItem(job))
            .join('');
    }

    /**
     * Create a manage job item HTML
     */
    createManageJobItem(job) {
        const createdDate = new Date(job.created_at).toLocaleDateString();
        const salaryText = job.salary_from && job.salary_to 
            ? `$${job.salary_from.toLocaleString()} - $${job.salary_to.toLocaleString()}`
            : 'Salary not specified';

        return `
            <div class="manage-job-item">
                <div class="manage-job-header">
                    <div class="manage-job-info">
                        <h3>${this.escapeHtml(job.title)}</h3>
                        <p>${this.escapeHtml(job.location)} • ${salaryText}</p>
                    </div>
                    <div class="manage-job-actions">
                        <button class="btn btn-secondary btn-small" onclick="ui.showJobDetails('${job.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-danger btn-small" onclick="ui.deleteJob('${job.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="manage-job-date">
                    Posted: ${createdDate}
                </div>
            </div>
        `;
    }

    /**
     * Delete a job
     */
    deleteJob(jobId) {
        if (confirm('Are you sure you want to delete this job posting?')) {
            this.state.deleteJob(jobId);
            this.renderManageJobsList();
        }
    }

    /**
     * Open modal
     */
    openModal() {
        if (this.modal) {
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${this.escapeHtml(message)}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    padding: 1rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideInRight 0.3s ease-out;
                }
                .notification-success { background: #48bb78; }
                .notification-error { background: #f56565; }
                .notification-info { background: #4299e1; }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Get empty state HTML
     */
    getEmptyState(message, icon = 'info-circle') {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${message}</h3>
                <p>Check back later or adjust your filters</p>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show loading spinner
     */
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('active');
        }
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('active');
        }
    }

    /**
     * Toggle mobile menu visibility
     */
    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) {
            navMenu.classList.toggle('open');
        }
    }

    /**
     * Update location filter with available locations
     */
    updateLocationFilter() {
        const locationFilter = document.getElementById('location-filter');
        if (!locationFilter) return;

        // Get unique locations from all jobs
        const locations = new Set();
        this.state.getAllJobs().forEach(job => {
            if (job.location) {
                locations.add(job.location);
            }
        });

        // Clear existing options (except "All Locations")
        const firstOption = locationFilter.firstElementChild;
        locationFilter.innerHTML = '';
        locationFilter.appendChild(firstOption);

        // Add location options
        Array.from(locations).sort().forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });

        // Restore selected value
        const filters = this.state.getFilters();
        locationFilter.value = filters.location;
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) {
            navMenu.classList.remove('open');
        }
    }
}

// Export for use in other modules
window.JobPortalUI = JobPortalUI;
