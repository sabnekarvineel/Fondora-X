# Fondora-X: Complete Project Overview for Interview

## 1. Project Summary

**Fondora-X** is a full-stack MERN (MongoDB, Express, React, Node.js) platform that connects four key user groups:
- **Students** - Looking for internships, mentorship, and skill development
- **Freelancers** - Offering services and building portfolios
- **Startups** - Seeking funding, hiring talent, and connecting with investors
- **Investors** - Finding investment opportunities and managing portfolios

The platform facilitates collaboration, job placement, funding connections, and networking within the tech ecosystem.

---

## 2. Tech Stack

### Backend
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js (REST API)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + Google OAuth 2.0
- **Password Security**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Real-time Communication**: Socket.IO
- **Email**: Nodemailer
- **Encryption**: Custom encryption for messages (E2E encryption)
- **Validation**: Express-validator

### Frontend
- **Framework**: React 18 with React Router v6
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Real-time**: Socket.IO client
- **State Management**: React Context API
- **UI**: Custom CSS (145KB stylesheet)

### Infrastructure
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Render.com
- **Database**: MongoDB Cloud (Atlas)
- **File Storage**: Cloudinary

---

## 3. Key Features Implemented

### 3.1 Authentication & Authorization
- **Google Sign-In Integration** (mandatory for registration)
  - Two-step registration: Sign in with Google → Select role & mobile
  - Automatic profile picture sync from Google
  - Server-side Google token validation
  - Mobile number validation (Indian format: 6-9 followed by 9 digits)
  
- **Traditional Email/Password Login** (fallback for existing users)
- **JWT Authentication** with 7-day expiration
- **Password Reset** via email with token-based reset
- **Role-Based Access Control**:
  - Student, Freelancer, Startup, Investor, Admin

### 3.2 User Profiles
Each user has role-specific profile sections:

**Student Profile**:
- Projects portfolio with descriptions and tech stack
- Resume upload
- Internship search preference

**Freelancer Profile**:
- Services list and hourly rates
- Portfolio with images and descriptions
- Customer ratings and reviews

**Startup Profile**:
- Company information (companyName, stage, mission)
- Founder details and co-founder information
- Team members with roles
- Open positions for jobs/internships
- Funding requirements
- Pitch deck upload

**Investor Profile**:
- Investment focus areas
- Investment range (min-max amounts)
- Portfolio of invested startups
- Funding history tracking

**General Profile Fields**:
- Bio (500 chars max), location, skills
- Social links (website, GitHub, LinkedIn, Instagram)
- Profile photo and cover banner
- Followers/Following system

### 3.3 Social Features
**Posts/Feed**:
- Create posts with text and media (images/videos)
- Like, comment, and reply system
- Nested comments with replies
- Share posts with custom messages
- Save posts for later
- View counts
- Media items tracking

**Notifications**:
- Real-time notifications via Socket.IO
- Notification dropdown in navbar
- Dedicated notifications page
- Types: likes, comments, follows, job applications, funding interest, etc.

**Messaging**:
- Real-time chat with Socket.IO
- End-to-end encryption for messages
- Message types: text, image, video
- Media encryption with IV
- Message status tracking (seen/unseen)
- Edit message functionality
- Conversation management

### 3.4 Job Management
**Job Posting** (by startups/companies):
- Title, description, category (9 categories: web, mobile, design, etc.)
- Job type: Job, Internship, Freelance, Project
- Skills required
- Experience level (beginner, intermediate, expert)
- Location type (remote, onsite, hybrid)
- Budget range (min-max)
- Duration specification
- Deadline setting
- Status tracking (open, closed, in-progress, completed)

**Job Application**:
- Users can apply to jobs
- Applications tracked with application IDs
- View applicant profiles
- Accept/reject applications

**Job Discovery**:
- Search and filter jobs
- Browse by category and type
- View job details with full information

### 3.5 Funding Management
**Funding Requests** (by startups):
- Company details (name, registration type, years in operation)
- Funding amount and currency
- Startup stage (idea, seed, series-a, b, c, d)
- Industry classification
- Business documents (pitch deck, business plan)
- Valuation and equity offered (0-100%)
- Revenue (current and projected)
- Customer metrics (current and projected)
- Team member profiles with LinkedIn links
- Milestones with dates and completion status
- Use of funds description
- Geographic location (country, city)
- Employee count
- Status tracking (open, in-negotiation, funded, closed)
- View count

**Investor Interest**:
- Investors can express interest in funding requests
- Track investor-startup relationships
- Interest status management

### 3.6 Engagement & Analytics
**Dashboard**:
- User-specific analytics
- Post engagement metrics
- Follower statistics
- Job applications received
- Funding request views

**Engagement Dashboard**:
- Track posts performance
- View engagement metrics (likes, comments, shares)
- Analyze user interactions

**Trending/Search**:
- Global search across users, posts, jobs, funding
- Advanced search with filters
- Trending content discovery

### 3.7 Admin Features
**Admin Panel**:
- User management (view all users)
- Ban/unban users
- Content moderation
- System-wide statistics
- User activity tracking

### 3.8 Settings & Preferences
- Notification preferences
- Privacy settings
- Account security
- Email preferences

### 3.9 End-to-End Encryption
**Message Encryption**:
- Conversation-specific encryption keys
- Master key management
- Key sync across devices
- Media file encryption (images/videos)
- Encryption IV (Initialization Vector) per message
- Encrypted media URL storage

**Security**:
- Master key salt and IV storage
- Server-side key management
- Key restoration for device switches

### 3.10 Feedback & Content Moderation
- User feedback submission
- Feedback tracking and analysis
- Content flags for moderation

---

## 4. Database Models

### Core Models
1. **User** (6,693 bytes)
   - Authentication fields (password, resetToken)
   - Profile fields (bio, location, skills, social links)
   - Role-specific profiles (student, freelancer, startup, investor)
   - Encryption keys for E2E messaging
   - Followers/following relationships
   - Notifications preference
   - Admin flags (banned, isBanned, bannedReason)

2. **Post** (2,040 bytes)
   - Content and media (images/videos)
   - Nested comments with replies
   - Likes, saves, shares, views
   - Tagged users
   - Author reference

3. **Job** (1,982 bytes)
   - Job details (title, description, type, category)
   - Requirements (skills, experience level)
   - Location and type (remote/onsite/hybrid)
   - Budget and duration
   - Status and applications tracking
   - Views count

4. **FundingRequest** (2,988 bytes)
   - Startup information
   - Funding details (amount, stage, currency)
   - Business documents and metrics
   - Team information
   - Milestones and status
   - Geographic and operational data

5. **Message** (2,055 bytes)
   - Encrypted content
   - Sender/receiver references
   - Message type (text/image/video)
   - Encryption metadata (mediaIv, isMediaEncrypted)
   - Seen status and timestamps
   - Edit tracking

6. **InvestorInterest** (1,123 bytes)
   - Investor-funding relationship
   - Interest status tracking

7. **Application** (1,022 bytes)
   - Job applicant tracking
   - Applicant info and job references

8. **Conversation** (968 bytes)
   - Chat session management
   - Participants tracking

9. **Notification** (1,076 bytes)
   - Real-time notifications
   - Notification types and status

10. **Feedback** (1,063 bytes)
    - User feedback collection
    - Feedback categorization

---

## 5. API Routes (16 Endpoints)

| Route | Purpose |
|-------|---------|
| `/api/auth` | Authentication (register, login, Google OAuth, password reset) |
| `/api/profile` | User profile management and retrieval |
| `/api/posts` | Post CRUD, comments, likes, saves, shares |
| `/api/search` | Global search functionality |
| `/api/messages` | Messaging and encryption key management |
| `/api/notifications` | Real-time notifications |
| `/api/jobs` | Job posting and management |
| `/api/applications` | Job application tracking |
| `/api/funding` | Funding request posting and management |
| `/api/investor-interest` | Investor interest tracking |
| `/api/dashboard` | Analytics and user dashboards |
| `/api/admin` | Admin panel and user management |
| `/api/settings` | User settings and preferences |
| `/api/feedback` | Feedback collection |
| `/api/engagement` | Engagement metrics and analytics |
| `/api/encryption` | E2E encryption key sync |

---

## 6. Frontend Components (35 Components)

### Authentication
- `Login.jsx` - Google Sign-In primary, email/password fallback
- `Register.jsx` - Two-step registration with role selection
- `ForgotPassword.jsx` - Password reset request
- `ResetPassword.jsx` - Token-based password reset

### Main Navigation
- `Navbar.jsx` - Global navigation with notifications and profile menu
- `Dashboard.jsx` - User dashboard with stats and activities

### Social Features
- `Feed.jsx` - Main feed with posts
- `CreatePost.jsx` - Post creation with media upload
- `PostCard.jsx` - Post display with comments, likes, shares
- `ShareModal.jsx` - Share post with custom message
- `SharePostPage.jsx` - Shared post public page

### Profile Management
- `Profile.jsx` - User profile view with role-specific sections
- `EditProfile.jsx` - Profile editing for all roles
- `NotificationDropdown.jsx` - Real-time notification dropdown
- `NotificationsPage.jsx` - Full notifications history

### Messaging
- `Messages.jsx` - Main messaging interface
- `ChatBox.jsx` - Individual chat conversation
- `ConversationList.jsx` - Active conversations list
- `KeyRestoreModal.jsx` - E2E encryption key restoration

### Jobs
- `Jobs.jsx` - Job listing and browsing
- `JobDetail.jsx` - Individual job details with application
- `PostJob.jsx` - Create new job posting
- `EditJob.jsx` - Edit job posting

### Funding
- `Funding.jsx` - Funding request listings
- `FundingDetail.jsx` - Individual funding request details
- `PostFunding.jsx` - Create funding request

### Discovery & Analytics
- `Search.jsx` - Global search interface
- `SearchResults.jsx` - Search results display
- `Admin.jsx` - Admin panel with user management
- `EngagementDashboard.jsx` - Engagement metrics
- `SavedPostsDashboard.jsx` - Saved posts activity

### Settings
- `Settings.jsx` - User settings and preferences
- `Toast.jsx` - Notification toast component

---

## 7. Key Technical Decisions & Features

### Security
1. **Google OAuth**: Primary authentication method
2. **JWT**: Stateless authentication with 7-day expiration
3. **bcryptjs**: Password hashing with salt
4. **E2E Encryption**: Messages encrypted client-side before transmission
5. **Mobile Validation**: Indian format enforcement (6-9 + 9 digits)
6. **Sparse Indexing**: Allows unique mobile numbers while permitting nulls

### Scalability
- **Cloudinary**: Handles image/video storage and CDN
- **MongoDB Indexes**: Optimized queries on frequently accessed fields
- **Socket.IO**: Real-time communication without polling
- **Vercel/Render**: Serverless and scalable hosting

### User Experience
- **Real-time Notifications**: Socket.IO-based instant updates
- **Role-Specific UI**: Tailored experience for each user type
- **Nested Comments**: Thread-style discussions on posts
- **Message Encryption**: Privacy-first messaging
- **Search**: Instant search across all content types

### Database Design
- **References**: Mongoose population for related data
- **Embedded Documents**: Comments and replies within posts
- **Sparse Indexes**: Efficient unique constraints with optional fields
- **Timestamps**: Auto-generated createdAt/updatedAt on all models

---

## 8. Current Development State

### Completed Features
✅ User authentication (Google + Email/password)
✅ Role-based profiles
✅ Social feed and posts
✅ Job marketplace
✅ Funding platform
✅ Real-time messaging
✅ E2E encryption
✅ Notifications system
✅ Search functionality
✅ Admin dashboard
✅ User engagement analytics

### In Development / TODO
- [ ] Reply comments feature (nested comment replies)
- [ ] Enhanced AI features
- [ ] Mentor finding system
- [ ] Streak/gamification features

---

## 9. Interview Talking Points

### 1. Problem Solved
- **Problem**: Fragmented ecosystem for students, freelancers, startups, and investors
- **Solution**: Unified platform connecting all four groups for collaboration, job placement, and funding

### 2. Technical Highlights
- **Full-stack MERN**: Demonstrated capability across entire stack
- **Real-time Features**: Socket.IO for instant notifications and messaging
- **Security**: Google OAuth, JWT, bcrypt, and E2E encryption
- **Scalability**: Database indexing, cloud storage, serverless deployment
- **Database Design**: Well-normalized schema with references and proper indexing

### 3. Advanced Features
- **E2E Encryption**: Client-side encryption for messages with key sync
- **Nested Comments**: Threaded discussions on posts
- **Role-Based Access**: Four distinct user types with specialized features
- **Admin Features**: User management and content moderation
- **Real-time Analytics**: Live engagement metrics and dashboards

### 4. Deployment
- **Frontend**: Vercel (preview deployments + production)
- **Backend**: Render.com with dynamic CORS for multiple environments
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary

### 5. Code Quality
- **ES6 Modules**: Modern JavaScript
- **Proper Separation**: Controllers, models, routes, middleware
- **Error Handling**: Global error middleware with detailed logging
- **Validation**: Express-validator for input validation
- **Authentication Middleware**: Protected routes for private endpoints

---

## 10. Architecture Overview

```
Fondora-X Platform
├── Frontend (React + Vite)
│   ├── Authentication Pages (Login, Register)
│   ├── Social Features (Feed, Posts, Comments)
│   ├── Job Marketplace
│   ├── Funding Platform
│   ├── Real-time Messaging with E2E Encryption
│   ├── User Profiles (4 role types)
│   └── Admin Dashboard
│
├── Backend (Node.js + Express)
│   ├── Authentication (Google OAuth + JWT)
│   ├── 16 API Route Groups
│   ├── 10 Database Models
│   ├── Real-time Socket.IO Server
│   ├── E2E Encryption Key Management
│   └── Admin Features
│
└── Database (MongoDB)
    ├── User Profiles (with role-specific data)
    ├── Posts & Comments
    ├── Jobs & Applications
    ├── Funding Requests & Interests
    ├── Messages & Conversations
    └── Notifications
```

---

## 11. Unique Selling Points

1. **Unified Ecosystem**: Unlike LinkedIn (professional) or AngelList (funding), Fondora-X integrates jobs, funding, social, and mentorship in one platform

2. **Four-Way Connection**: Directly connects students ↔ startups ↔ investors ↔ freelancers

3. **Security-First**: E2E encrypted messaging built-in, not an afterthought

4. **Real-time Platform**: Socket.IO enables instant notifications, live updates, and real-time messaging

5. **Comprehensive Profiles**: Deep profile data for each role type (investor portfolios, startup metrics, student projects)

---

## 12. Metrics & Numbers

- **Users**: 4 role types
- **Models**: 10 database schemas
- **API Routes**: 16 endpoint groups (100+ total endpoints)
- **Components**: 35 React components
- **Features**: 9 major feature categories
- **Security Layers**: 3 (OAuth, JWT, E2E)
- **Database Indexes**: Multiple for performance optimization

---

## 13. Potential Follow-up Questions & Answers

### Q: How do you handle user authentication?
A: We use Google OAuth as the primary method with server-side validation, plus a JWT fallback for email/password. JWTs are issued on successful login with a 7-day expiration, and all protected routes validate the token in the Authorization header.

### Q: How does encryption work for messages?
A: Each conversation has a unique encryption key derived from the master key. Messages are encrypted client-side in React before being sent. The server stores the encrypted content and meta-information (IV). On retrieval, the client decrypts using the conversation key.

### Q: How do you manage roles and permissions?
A: Users select their role during registration (student, freelancer, startup, investor). Each role has a role-specific profile section in the User model. API routes check the user's role in the auth middleware before granting access to role-specific features.

### Q: How do you handle real-time notifications?
A: Socket.IO maintains persistent WebSocket connections. When an event occurs (like, comment, job application), the backend emits a socket event to the relevant users. The frontend listens and updates the UI in real-time.

### Q: How is the database designed?
A: MongoDB with Mongoose ODM. Models use references (ObjectId) for relationships and population for eager loading. Indexes are created on frequently queried fields (author, createdAt, status). Sparse indexes allow unique constraints on optional fields like mobile numbers.

### Q: How do you ensure security?
A: Multiple layers: (1) Google OAuth for authentication, (2) JWT tokens for session management, (3) bcryptjs for password hashing, (4) E2E encryption for messages, (5) Input validation with express-validator, (6) Role-based access control in middleware.

---

## 14. Demo Walkthrough Script

1. **Registration**: Show Google Sign-In → Role selection → Mobile verification → Account created
2. **Social Feed**: Create post with image → Get real-time notifications on likes/comments
3. **Job Posting**: Create job → Show job listing → Apply as different user
4. **Funding**: Create funding request → Show investor interest feature
5. **Messaging**: Send encrypted message → Show real-time delivery
6. **Admin**: Show user management and banning features
7. **Analytics**: Show engagement dashboard with metrics

---


