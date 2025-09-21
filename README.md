# Job Portal Application

A modern, responsive job portal built with vanilla HTML, CSS, and JavaScript. Features dual user roles (Job Seekers and Recruiters) with comprehensive job management and application tracking.

## 🎯 Live Demo

The website is deployed on Vercel! You can view the live demo here: https://job-portal-wheat-chi.vercel.app/

You can also run the project locally by opening `index.html` in your web browser - no build process required!

## ✨ Features

### Core Functionality
- **Dual User Roles**: Toggle between Job Seeker and Recruiter modes
- **Job Management**: Add, update, delete, and sort job postings
- **Application System**: Apply for jobs and track application status
- **Search & Filter**: Find jobs by title, company, remote work, and category
- **Detailed Job Views**: Modal dialogs with complete job information

### Advanced Features
- **Real-time Data**: Fetches jobs from external API (https://jsonfakery.com/jobs)
- **Persistent Storage**: All user data saved to localStorage
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Data Export/Import**: Backup and restore user data
- **Developer Tools**: Built-in debugging and statistics panel

### Search, Filter & Sort Options
- **Search**: By job title, company name, or description
- **Filter**: Remote work opportunities, job categories
- **Sort**: Newest first, oldest first, highest/lowest salary

## 🏗️ Architecture

### Modular Design
The application follows a clean modular architecture:

```
job-portal/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles and responsive design
├── js/
│   ├── api.js          # External API integration & data normalization
│   ├── state.js        # State management & localStorage persistence
│   ├── ui.js           # UI rendering & user interactions
│   └── main.js         # Application initialization & coordination
└── README.md           # This file
```

### Key Components

#### 1. API Client (`api.js`)
- Fetches jobs from https://jsonfakery.com/jobs
- Normalizes inconsistent API data
- Implements caching with 5-minute timeout
- Provides fallback mock data for offline use
- Handles network errors gracefully

#### 2. State Management (`state.js`)
- Centralized application state with event system
- localStorage persistence for all user data
- Manages user roles, applications, and filters
- CRUD operations for user-posted jobs
- Real-time filtering and sorting

#### 3. UI Controller (`ui.js`)
- Dynamic rendering of job cards and lists
- Modal dialogs for detailed job views
- Form handling for job posting
- Responsive navigation and role switching
- Toast notifications for user feedback

#### 4. Main App (`main.js`)
- Coordinates all modules
- Handles application lifecycle
- Error handling and recovery
- Developer tools and debugging features

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software or build tools required

### Installation
1. Download or clone the project files
2. Ensure all files are in the same directory structure as shown above
3. Open `index.html` in your web browser

### Usage

#### For Job Seekers:
1. Browse available jobs on the main page
2. Use search and filters to find relevant positions
3. Click "View Details" to see full job descriptions
4. Apply for jobs with the "Apply Now" button
5. Track your applications in the "My Applications" tab

#### For Recruiters:
1. Switch to "Recruiter" mode using the dropdown
2. Post new jobs using the "Post Job" form
3. Manage your posted jobs in the "Manage Jobs" section
4. View, edit, or delete your job postings

### Developer Features
- **Ctrl/Cmd + D**: Toggle developer panel with statistics
- **Ctrl/Cmd + Shift + R**: Force refresh jobs from API
- Console commands: `app.getStats()`, `app.refreshJobs()`, `app.exportData()`

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured experience with grid layout
- **Tablet**: Optimized for touch interactions
- **Mobile**: Single-column layout with touch-friendly buttons

## 💾 Data Management

### Data Sources
1. **External API**: Jobs fetched from jsonfakery.com/jobs
2. **User Data**: Applications and posted jobs stored locally
3. **Cache**: API responses cached for 5 minutes

### Storage
- All user data persists in localStorage
- Automatic data recovery on page reload
- Export/import functionality for backup

### Data Structure
```javascript
{
  userRole: 'job_seeker' | 'recruiter',
  applications: [...],
  userJobs: [...],
  filters: { search, sort, remoteOnly, category }
}
```

## 🔧 Technical Implementation

### Key Technologies
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Grid, Flexbox, animations, and responsive design
- **Vanilla JavaScript**: ES6+ features, async/await, classes
- **Font Awesome**: Icons and visual elements

### Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Performance Features
- Lazy loading of job data
- Efficient DOM updates
- Debounced search input
- Optimized event handling

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#667eea to #764ba2)
- **Success**: Green (#48bb78)
- **Error**: Red (#f56565)
- **Neutral**: Gray shades for text and borders

### Typography
- **Font**: System fonts for optimal performance
- **Headings**: Bold weights with proper hierarchy
- **Body**: Readable line height and spacing

### Components
- Cards with subtle shadows and hover effects
- Responsive form inputs with focus states
- Animated modals and notifications
- Consistent button styles and interactions

## 📊 Features Breakdown

### ✅ Required Features Implemented
- [x] Add, update, delete, and sort job postings
- [x] View job descriptions in detail
- [x] User roles (Recruiter / Job Seeker)
- [x] Job seekers can apply for jobs
- [x] Search by title/company + Filter by remote + Sort by date/salary
- [x] Uses provided API endpoint

### 🚀 Bonus Features Added
- [x] Responsive mobile-first design
- [x] Local data persistence
- [x] Real-time search and filtering
- [x] Application tracking system
- [x] Data export/import functionality
- [x] Developer tools and debugging
- [x] Error handling and offline support
- [x] Modern UI with animations
- [x] Comprehensive documentation

## 🔍 API Integration

The application integrates with the provided jobs API:
- **Endpoint**: https://jsonfakery.com/jobs
- **Method**: GET request to fetch all jobs
- **Data Normalization**: Handles inconsistent API response format
- **Error Handling**: Graceful fallback to mock data
- **Caching**: 5-minute cache to reduce API calls

### API Response Handling
The API sometimes returns malformed JSON strings for qualifications. The application:
1. Attempts to parse JSON strings
2. Falls back to empty arrays for invalid data
3. Normalizes all job objects to consistent format
4. Provides meaningful defaults for missing fields

## 🛠️ Development

### Code Organization
- Modular ES6 classes for maintainability
- Event-driven architecture for loose coupling
- Consistent error handling patterns
- Extensive commenting and documentation

### Best Practices
- XSS protection with HTML escaping
- Responsive design with mobile-first approach
- Semantic HTML for accessibility
- Progressive enhancement philosophy
- Clean separation of concerns

### Future Enhancements
- User authentication and profiles
- Real-time notifications
- Advanced job matching algorithms
- Recruiter dashboard analytics
- Integration with more job APIs

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

---

**Happy Job Hunting! 🎯**
