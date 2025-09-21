/**
 * UI Controller for Job Portal
 * Handles all UI rendering, interactions, and DOM manipulation
 */

class JobPortalUI {
    constructor(state) {
        this.state = state;
        this.currentView = 'jobs';
        this.modal = null;
        this.applicationModal = null;
        this.setupEventListeners();
        this.setupStateListeners();
    }

    /**
     * Initialize the UI
     */
    init() {
        this.updateRoleUI();
        this.setupFilters();
        this.updateThemeUI();
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

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = this.state.getTheme();
                this.state.setTheme(currentTheme === 'light' ? 'dark' : 'light');
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

        // Pagination controls event delegation
        const jobsView = document.getElementById('jobs-view');
        if (jobsView) {
            jobsView.addEventListener('click', (e) => {
                const target = e.target.closest('.pagination-btn');
                if (!target || target.disabled) return;

                const page = target.dataset.page;
                if (page) this.state.setPage(parseInt(page));
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
            if (e.key === 'Escape') {
                if (this.applicationModal && this.applicationModal.classList.contains('active')) {
                    this.closeApplicationModal();
                } else if (this.modal && this.modal.classList.contains('active')) {
                    this.closeModal();
                }
            }
        });

        // Application modal close
        const closeApplicationModalBtn = document.getElementById('close-application-modal');
        if (closeApplicationModalBtn) {
            closeApplicationModalBtn.addEventListener('click', () => {
                this.closeApplicationModal();
            });
        }

        // Application modal backdrop click
        this.applicationModal = document.getElementById('application-modal');
        this.applicationModal.addEventListener('click', (e) => {
            if (e.target === this.applicationModal) {
                this.closeApplicationModal();
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
            // Re-render the current view if it's affected by role change
            if (this.currentView === 'jobs') {
                this.renderJobsGrid(this.state.getPaginatedJobs());
            }
        });

        this.state.addEventListener('themeChanged', (theme) => {
            this.updateThemeUI();
        });

        this.state.addEventListener('jobsUpdated', (jobs) => {
            if (this.currentView === 'jobs') {
                const paginatedJobs = this.state.getPaginatedJobs();
                this.renderJobsGrid(paginatedJobs);
                this.renderPaginationControls();
            }
        });

        this.state.addEventListener('pageChanged', () => {
            if (this.currentView !== 'jobs') return;
            const paginatedJobs = this.state.getPaginatedJobs();
            this.renderJobsGrid(paginatedJobs);
            this.renderPaginationControls();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        this.state.addEventListener('applicationSubmitted', (application) => {
            this.showNotification('Application submitted successfully!', 'success');
        });

        this.state.addEventListener('jobAdded', (job) => {
            this.showNotification('Job posted successfully!', 'success');
            this.clearJobForm();
        });

        this.state.addEventListener('jobSaved', (jobId) => {
            this.updateSaveButton(jobId, true);
            this.showNotification('Job saved!', 'info');
        });

        this.state.addEventListener('jobUnsaved', (jobId) => {
            this.updateSaveButton(jobId, false);
            // Refresh saved jobs view if it's active
            if (this.currentView === 'saved-jobs') {
                this.renderSavedJobs();
            }
        });

        this.state.addEventListener('jobDeleted', (jobId) => {
            this.showNotification('Job deleted successfully!', 'success');
        });

        this.state.addEventListener('jobUpdated', (job) => {
            this.showNotification('Job updated successfully!', 'success');
            if (this.currentView === 'post-job') {
                this.showView('manage-jobs');
            }
        });

        this.state.addEventListener('applicationUpdated', (application) => {
            this.showNotification(`Application status updated to "${application.status}"`, 'success');
            // Refresh 'My Applications' view if it's active
            if (this.currentView === 'applications') {
                this.renderApplicationsList();
            }
            // Update the badge in the applicants modal if it's open
            const applicantItem = document.getElementById(`applicant-item-${application.id}`);
            if (applicantItem) {
                const statusBadge = applicantItem.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = `status-badge status-${application.status}`;
                    statusBadge.textContent = application.status;
                }
            }
        });

    }

    /**
     * Update UI based on theme
     */
    updateThemeUI() {
        const theme = this.state.getTheme();
        document.body.classList.toggle('dark-mode', theme === 'dark');

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
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
        const savedJobsNav = document.getElementById('saved-jobs-nav');

        if (role === 'job_seeker') {
            if (applicationsNav) applicationsNav.style.display = 'flex';
            if (savedJobsNav) savedJobsNav.style.display = 'flex';
            if (postJobNav) postJobNav.style.display = 'none';
            if (manageJobsNav) manageJobsNav.style.display = 'none';
        } else if (role === 'recruiter') {
            if (applicationsNav) applicationsNav.style.display = 'none';
            if (savedJobsNav) savedJobsNav.style.display = 'none';
            if (postJobNav) postJobNav.style.display = 'flex';
            if (manageJobsNav) manageJobsNav.style.display = 'flex';
        }

        // Switch to jobs view if current view is no longer available
        if ((role === 'job_seeker' && ['post-job', 'manage-jobs'].includes(this.currentView)) ||
            (role === 'recruiter' && ['applications', 'saved-jobs'].includes(this.currentView))) {
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
                const paginatedJobs = this.state.getPaginatedJobs();
                this.renderJobsGrid(paginatedJobs);
                this.renderPaginationControls();
                this.updateCategoryFilter();
                this.updateLocationFilter();
                break;
            case 'applications':
                this.renderApplicationsList();
                break;
            case 'saved-jobs':
                this.renderSavedJobs();
                break;
            case 'post-job':
                // Reset form to "add" mode by default
                this.resetJobForm();
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

        const isSaved = this.state.isJobSaved(job.id);

        return `
            <div class="job-card" data-job-id="${job.id}">
                ${userRole === 'job_seeker' ? `
                    <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="ui.handleSaveToggle('${job.id}')" title="${isSaved ? 'Unsave Job' : 'Save Job'}">
                        <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                ` : ''}
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

        const isSaved = this.state.isJobSaved(jobId);
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
                <div class="modal-section modal-footer-actions">
                    <button class="btn ${hasApplied ? 'btn-secondary' : 'btn-primary'}" 
                            ${hasApplied ? 'disabled' : `onclick="ui.applyForJob('${job.id}')"`}>
                        <i class="fas ${hasApplied ? 'fa-check' : 'fa-paper-plane'}"></i> 
                        ${hasApplied ? 'Already Applied' : 'Apply for this Job'}
                    </button>
                    <button class="btn btn-secondary save-toggle-btn ${isSaved ? 'saved' : ''}" onclick="ui.handleSaveToggle('${job.id}')">
                        <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i> ${isSaved ? 'Saved' : 'Save'}
                    </button>
                </div>
            ` : ''}
        `;

        this.openModal();
    }

    /**
     * Toggle saving a job
     */
    handleSaveToggle(jobId) {
        if (this.state.getUserRole() !== 'job_seeker') return;

        if (this.state.isJobSaved(jobId)) {
            this.state.unsaveJob(jobId);
        } else {
            this.state.saveJob(jobId);
        }
    }

    /**
     * Update the appearance of a save button for a specific job
     */
    updateSaveButton(jobId, isSaved) {
        const buttons = document.querySelectorAll(`[onclick="ui.handleSaveToggle('${jobId}')"]`);
        buttons.forEach(button => {
            button.classList.toggle('saved', isSaved);
            const icon = button.querySelector('i');

            if (button.classList.contains('save-btn')) { // Card button
                button.title = isSaved ? 'Unsave Job' : 'Save Job';
                if (icon) icon.className = `${isSaved ? 'fas' : 'far'} fa-bookmark`;
            } else if (button.classList.contains('save-toggle-btn')) { // Modal button
                if (icon) icon.className = `${isSaved ? 'fas' : 'far'} fa-bookmark`;
                const textNode = Array.from(button.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.textContent = ` ${isSaved ? 'Saved' : 'Save'}`;
                }
            }
        });
    }

    /**
     * Apply for a job
     */
    applyForJob(jobId) {
        this.showApplicationModal(jobId);
    }

    /**
     * Show the custom application modal with a form
     */
    showApplicationModal(jobId) {
        const job = this.state.getJobById(jobId);
        if (!job) {
            this.showNotification('Job not found.', 'error');
            return;
        }

        const applicationModalBody = document.getElementById('application-modal-body');
        if (!this.applicationModal || !applicationModalBody) return;

        applicationModalBody.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">Apply for ${this.escapeHtml(job.title)}</h2>
                <p class="modal-subtitle">at ${this.escapeHtml(job.company)}</p>
            </div>
            <form id="application-form" class="job-form" style="box-shadow: none; padding: 0;">
                <input type="hidden" name="jobId" value="${job.id}">
                <div class="form-group">
                    <label for="applicant-name">Full Name *</label>
                    <input type="text" id="applicant-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="applicant-email">Email Address *</label>
                    <input type="email" id="applicant-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="applicant-cover-letter">Cover Letter (Optional)</label>
                    <textarea id="applicant-cover-letter" name="coverLetter" rows="4"></textarea>
                </div>
                <div class="form-group" style="display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 0;">
                    <button type="button" class="btn btn-secondary" id="cancel-application-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Application</button>
                </div>
            </form>
        `;

        this.applicationModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add event listeners for the new form
        document.getElementById('application-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleApplicationSubmission(new FormData(e.target));
        });

        document.getElementById('cancel-application-btn').addEventListener('click', () => {
            this.closeApplicationModal();
        });
    }

    /**
     * Handle application form submission from the custom modal
     */
    handleApplicationSubmission(formData) {
        const jobId = formData.get('jobId');
        const applicantDetails = {
            name: formData.get('name'),
            email: formData.get('email'),
            coverLetter: formData.get('coverLetter')
        };

        if (!applicantDetails.name || !applicantDetails.email) {
            this.showNotification('Please fill in your name and email.', 'error');
            return;
        }

        try {
            this.state.applyForJob(jobId, applicantDetails);
            this.closeApplicationModal();
            this.closeModal(); // Close job details modal if it was open
            
            // Refresh the current view to update the UI
            if (this.currentView === 'jobs') {
                const paginatedJobs = this.state.getPaginatedJobs();
                this.renderJobsGrid(paginatedJobs);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    /**
     * Close the application modal
     */
    closeApplicationModal() {
        if (this.applicationModal) {
            this.applicationModal.classList.remove('active');
            // Only reset body overflow if no other modal is active
            if (!this.modal || !this.modal.classList.contains('active')) {
                document.body.style.overflow = '';
            }
        }
    }

    /**
     * Show the job form in "edit" mode
     */
    showEditJobForm(jobId) {
        const job = this.state.getJobById(jobId);
        if (!job) {
            this.showNotification('Job not found.', 'error');
            return;
        }

        // Switch to the form view
        this.showView('post-job');

        // Update form for editing
        document.querySelector('#post-job-view h2').textContent = 'Edit Job';
        document.querySelector('#job-form button[type="submit"]').textContent = 'Update Job';

        // Add hidden input for job ID
        let hiddenInput = document.getElementById('job-id-edit');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'job-id-edit';
            document.getElementById('job-form').prepend(hiddenInput);
        }
        hiddenInput.value = jobId;

        // Populate form fields
        document.getElementById('job-title').value = job.title || '';
        document.getElementById('job-company').value = job.company || '';
        document.getElementById('job-location').value = job.location || '';
        document.getElementById('job-salary-from').value = job.salary_from || '';
        document.getElementById('job-salary-to').value = job.salary_to || '';
        document.getElementById('job-type').value = job.employment_type || '';
        document.getElementById('job-category').value = job.job_category || '';
        document.getElementById('job-description').value = job.description || '';
        document.getElementById('job-qualifications').value = (job.qualifications || []).join('\n');
        document.getElementById('job-contact').value = job.contact || '';
        document.getElementById('job-openings').value = job.number_of_opening || 1;
        document.getElementById('job-remote').checked = job.is_remote_work || false;
        
        if (job.application_deadline) {
            const deadline = new Date(job.application_deadline).toISOString().split('T')[0];
            document.getElementById('job-deadline').value = deadline;
        }
    }

    /**
     * Handle job form submission
     */
    handleJobSubmission() {
        const form = document.getElementById('job-form');
        if (!form) return;

        const formData = new FormData(form);
        const editJobId = document.getElementById('job-id-edit')?.value;
        
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
            if (editJobId) {
                this.state.updateJob(editJobId, jobData);
            } else {
                this.state.addJob(jobData);
            }
        } catch (error) {
            this.showNotification('Error posting job: ' + error.message, 'error');
        }
    }

    /**
     * Reset the job form to its default "add" state
     */
    resetJobForm() {
        this.clearJobForm();
        document.querySelector('#post-job-view h2').textContent = 'Post a New Job';
        document.querySelector('#job-form button[type="submit"]').textContent = 'Post Job';
        document.getElementById('job-id-edit')?.remove();
        
        const deadlineInput = document.getElementById('job-deadline');
        if (deadlineInput) {
            deadlineInput.min = new Date().toISOString().split('T')[0];
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
     * Render saved jobs
     */
    renderSavedJobs() {
        const savedJobsGrid = document.getElementById('saved-jobs-grid');
        if (!savedJobsGrid) return;

        const savedJobs = this.state.getSavedJobs();
        const description = document.querySelector('#saved-jobs-view .view-description');

        if (savedJobs.length === 0) {
            savedJobsGrid.innerHTML = this.getEmptyState('No saved jobs', 'bookmark');
            if (description) description.style.display = 'none';
            return;
        }

        if (description) description.style.display = 'block';
        savedJobsGrid.innerHTML = savedJobs.map(job => this.createJobCard(job)).join('');
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
        const applicants = this.state.getApplicationsForJob(job.id);
        const applicantCount = applicants.length;

        return `
            <div class="manage-job-item">
                <div class="manage-job-header">
                    <div class="manage-job-info">
                        <h3>${this.escapeHtml(job.title)}</h3>
                        <p>${this.escapeHtml(job.location)} • ${salaryText}</p>
                    </div>
                    <div class="manage-job-actions">
                        <button class="btn btn-primary btn-small" onclick="ui.showApplicantsForJob('${job.id}')">
                            <i class="fas fa-users"></i> Applicants (${applicantCount})
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="ui.showEditJobForm('${job.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
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
     * Handle application status change from recruiter view
     */
    handleStatusChange(applicationId, newStatus) {
        this.state.updateApplicationStatus(applicationId, newStatus);
    }

    /**
     * Show applicants for a specific job in a modal
     */
    showApplicantsForJob(jobId) {
        const job = this.state.getJobById(jobId);
        if (!job) {
            this.showNotification('Job not found.', 'error');
            return;
        }

        const applicants = this.state.getApplicationsForJob(jobId);
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        let applicantsHtml;
        if (applicants.length > 0) {
            applicantsHtml = applicants.map(applicant => {
                const statuses = ['pending', 'reviewed', 'interviewing', 'hired', 'rejected'];
                const statusOptions = statuses.map(s => 
                    `<option value="${s}" ${applicant.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                ).join('');

                return `
                <div class="applicant-item" id="applicant-item-${applicant.id}">
                    <div class="applicant-item-header">
                        <h5>${this.escapeHtml(applicant.name)}</h5>
                        <span class="status-badge status-${applicant.status}">${applicant.status}</span>
                    </div>
                    <p><a href="mailto:${this.escapeHtml(applicant.email)}">${this.escapeHtml(applicant.email)}</a></p>
                    ${applicant.coverLetter ? `
                        <details>
                            <summary>View Cover Letter</summary>
                            <p>${this.escapeHtml(applicant.coverLetter)}</p>
                        </details>
                    ` : '<p style="font-style: italic; color: #718096;">No cover letter submitted.</p>'}
                    <div class="applicant-item-footer">
                        <label for="status-select-${applicant.id}">Update Status:</label>
                        <select id="status-select-${applicant.id}" class="applicant-status-select" onchange="ui.handleStatusChange('${applicant.id}', this.value)">
                            ${statusOptions}
                        </select>
                    </div>
                </div>
            `}).join('');
        } else {
            applicantsHtml = '<p>There are no applicants for this job yet.</p>';
        }

        modalBody.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">Applicants for ${this.escapeHtml(job.title)}</h2>
                <p class="modal-subtitle">at ${this.escapeHtml(job.company)}</p>
            </div>
            <div class="modal-section">
                ${applicantsHtml}
            </div>
        `;

        this.openModal();
    }

    /**
     * Render pagination controls for the jobs list
     */
    renderPaginationControls() {
        const paginationControls = document.getElementById('pagination-controls');
        if (!paginationControls) return;

        const info = this.state.getPaginationInfo();
        if (info.totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }

        let buttonsHtml = '';

        // Previous button
        buttonsHtml += `<button class="pagination-btn" data-page="${info.currentPage - 1}" ${!info.hasPrevPage ? 'disabled' : ''}>&laquo; Prev</button>`;

        // Page number buttons logic
        const maxButtons = 5;
        let startPage, endPage;

        if (info.totalPages <= maxButtons) {
            startPage = 1;
            endPage = info.totalPages;
        } else {
            const maxPagesBeforeCurrent = Math.floor(maxButtons / 2);
            const maxPagesAfterCurrent = Math.ceil(maxButtons / 2) - 1;
            if (info.currentPage <= maxPagesBeforeCurrent) {
                startPage = 1;
                endPage = maxButtons;
            } else if (info.currentPage + maxPagesAfterCurrent >= info.totalPages) {
                startPage = info.totalPages - maxButtons + 1;
                endPage = info.totalPages;
            } else {
                startPage = info.currentPage - maxPagesBeforeCurrent;
                endPage = info.currentPage + maxPagesAfterCurrent;
            }
        }

        if (startPage > 1) {
            buttonsHtml += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) buttonsHtml += `<span class="pagination-ellipsis" style="padding: 0.5rem;">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            buttonsHtml += `<button class="pagination-btn ${i === info.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < info.totalPages) {
            if (endPage < info.totalPages - 1) buttonsHtml += `<span class="pagination-ellipsis" style="padding: 0.5rem;">...</span>`;
            buttonsHtml += `<button class="pagination-btn" data-page="${info.totalPages}">${info.totalPages}</button>`;
        }

        // Next button
        buttonsHtml += `<button class="pagination-btn" data-page="${info.currentPage + 1}" ${!info.hasNextPage ? 'disabled' : ''}>Next &raquo;</button>`;

        paginationControls.innerHTML = buttonsHtml;
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
            // If application modal is also closed, ensure overflow is reset
            if (!this.applicationModal || !this.applicationModal.classList.contains('active')) {
                document.body.style.overflow = '';
            }
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
