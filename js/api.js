/**
 * API Client for Job Portal
 * Handles fetching and normalizing job data from external API
 */

class JobAPI {
    constructor() {
        this.baseURL = 'https://jsonfakery.com/jobs';
        this.cache = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = null;
    }

    /**
     * Fetch jobs from the API with caching
     */
    async fetchJobs() {
        // Return cached data if still valid
        if (this.cache && this.lastFetch && (Date.now() - this.lastFetch < this.cacheTimeout)) {
            return this.cache;
        }

        try {
            const response = await fetch(this.baseURL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const normalizedJobs = this.normalizeJobs(data);
            
            // Cache the normalized data
            this.cache = normalizedJobs;
            this.lastFetch = Date.now();
            
            return normalizedJobs;
        } catch (error) {
            console.error('Error fetching jobs:', error);
            
            // Return cached data if available, otherwise empty array
            if (this.cache) {
                console.warn('Using cached data due to fetch error');
                return this.cache;
            }
            
            // Return mock data as fallback
            return this.getMockJobs();
        }
    }

    /**
     * Normalize job data from the API to ensure consistent structure
     */
    normalizeJobs(jobs) {
        if (!Array.isArray(jobs)) {
            console.warn('Jobs data is not an array:', jobs);
            return [];
        }

        return jobs.map(job => this.normalizeJob(job)).filter(job => job !== null);
    }

    /**
     * Normalize a single job object
     */
    normalizeJob(job) {
        try {
            // Parse qualifications if it's a JSON string
            let qualifications = [];
            if (job.qualifications) {
                try {
                    if (typeof job.qualifications === 'string') {
                        qualifications = JSON.parse(job.qualifications);
                    } else if (Array.isArray(job.qualifications)) {
                        qualifications = job.qualifications;
                    }
                } catch (e) {
                    console.warn('Error parsing qualifications:', e);
                    qualifications = [];
                }
            }

            // Ensure qualifications is an array
            if (!Array.isArray(qualifications)) {
                qualifications = [];
            }

            // Parse dates
            const parseDate = (dateStr) => {
                if (!dateStr) return null;
                try {
                    const date = new Date(dateStr);
                    return isNaN(date.getTime()) ? null : date.toISOString();
                } catch (e) {
                    console.warn('Error parsing date:', dateStr, e);
                    return null;
                }
            };

            return {
                id: job.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: job.title || 'Untitled Position',
                description: job.description || 'No description available',
                company: job.company || 'Unknown Company',
                location: job.location || 'Location not specified',
                salary_from: parseInt(job.salary_from) || null,
                salary_to: parseInt(job.salary_to) || null,
                employment_type: job.employment_type || 'Full-time',
                application_deadline: parseDate(job.application_deadline),
                qualifications: qualifications,
                contact: job.contact || 'No contact information',
                job_category: job.job_category || 'Other',
                is_remote_work: Boolean(job.is_remote_work),
                number_of_opening: parseInt(job.number_of_opening) || 1,
                created_at: parseDate(job.created_at) || new Date().toISOString(),
                updated_at: parseDate(job.updated_at) || new Date().toISOString(),
                source: 'api'
            };
        } catch (error) {
            console.error('Error normalizing job:', error, job);
            return null;
        }
    }

    /**
     * Get mock jobs as fallback data
     */
    getMockJobs() {
        return [
            {
                id: 'mock_1',
                title: 'Frontend Developer',
                description: 'We are looking for a skilled Frontend Developer to join our team. You will be responsible for building user-facing web applications using modern JavaScript frameworks.',
                company: 'Tech Solutions Inc',
                location: 'San Francisco, CA',
                salary_from: 80000,
                salary_to: 120000,
                employment_type: 'Full-time',
                application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                qualifications: ['3+ years React experience', 'JavaScript/TypeScript proficiency', 'CSS/HTML expertise'],
                contact: 'hr@techsolutions.com',
                job_category: 'Software Engineer',
                is_remote_work: true,
                number_of_opening: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                source: 'mock'
            },
            {
                id: 'mock_2',
                title: 'Data Scientist',
                description: 'Join our data team to work on machine learning projects and help drive business insights through data analysis.',
                company: 'Data Corp',
                location: 'New York, NY',
                salary_from: 90000,
                salary_to: 140000,
                employment_type: 'Full-time',
                application_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                qualifications: ['Python/R proficiency', 'Machine Learning experience', 'Statistics background'],
                contact: 'careers@datacorp.com',
                job_category: 'Data Scientist',
                is_remote_work: false,
                number_of_opening: 1,
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'mock'
            },
            {
                id: 'mock_3',
                title: 'Full-Stack Developer',
                description: 'Looking for a versatile full-stack developer to work on both frontend and backend systems.',
                company: 'Startup Hub',
                location: 'Austin, TX',
                salary_from: 70000,
                salary_to: 100000,
                employment_type: 'Contract',
                application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
                qualifications: ['Node.js experience', 'React/Vue.js skills', 'Database knowledge'],
                contact: 'jobs@startuphub.io',
                job_category: 'Full-stack Developer',
                is_remote_work: true,
                number_of_opening: 3,
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'mock'
            }
        ];
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache = null;
        this.lastFetch = null;
    }

    /**
     * Get all unique job categories from current data
     */
    getJobCategories() {
        if (!this.cache) {
            return [];
        }

        const categories = new Set();
        this.cache.forEach(job => {
            if (job.job_category) {
                categories.add(job.job_category);
            }
        });

        return Array.from(categories).sort();
    }

    /**
     * Get statistics about current job data
     */
    getStats() {
        if (!this.cache) {
            return {
                total: 0,
                remote: 0,
                categories: 0,
                avgSalary: 0
            };
        }

        const remote = this.cache.filter(job => job.is_remote_work).length;
        const categories = this.getJobCategories().length;
        
        const salaries = this.cache
            .filter(job => job.salary_from && job.salary_to)
            .map(job => (job.salary_from + job.salary_to) / 2);
        
        const avgSalary = salaries.length > 0 
            ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
            : 0;

        return {
            total: this.cache.length,
            remote,
            categories,
            avgSalary
        };
    }
}

// Export for use in other modules
window.JobAPI = JobAPI;
