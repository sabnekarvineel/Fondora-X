# Google Authentication Setup - Mandatory Registration

## Overview
This implementation makes Google authentication mandatory for both login and registration. Users can only register and login using their Google accounts.

## Changes Made

### Backend Changes

#### 1. **Auth Controller** (`backend/controllers/authController.js`)
- **Register endpoint**: Now returns 403 error directing users to use Google Sign-In
- **Google Token Verification** (`verifyGoogleToken`):
  - Accepts `token`, `role`, `mobile`, and `companyName` parameters
  - **For new users (registration)**:
    - Validates role selection (student, freelancer, startup, investor)
    - Validates mobile number (Indian format: 6-9 followed by 9 digits)
    - Checks for duplicate mobile numbers
    - For startup users, accepts company name
    - Creates user with Google profile data
  - **For existing users (login)**:
    - Links Google account if not already linked
    - Updates profile photo if missing

#### 2. **User Model** (`backend/models/User.js`)
- **Mobile field**: Changed to optional with sparse indexing (allows null while maintaining uniqueness)
- **Password field**: Made optional (OAuth users don't need traditional passwords)

### Frontend Changes

#### 1. **Register Component** (`frontend/src/components/Register.jsx`)
- **Two-step registration**:
  1. First: User signs in with Google
  2. Second: User selects role, provides mobile number, and (if startup) company name
- Google profile picture and name displayed after sign-in
- Option to use different Google account
- Full validation before submission

#### 2. **Login Component** (`frontend/src/components/Login.jsx`)
- **Primary method**: Google Sign-In button (prominently displayed)
- **Secondary method**: Email/password login (hidden by default, accessible via toggle link)
- Users can still use traditional login if they have email/password credentials
- Better UX with Google as the primary option

## Environment Variables Required

### Frontend (`.env`)
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=your_api_url
```

### Backend (`.env`)
```
GOOGLE_CLIENT_ID=your_google_client_id
```

## Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`, `https://your-domain.com`
   - Authorized redirect URIs: Your frontend URL
5. Copy the Client ID

### 2. Update Environment Variables
- Add `GOOGLE_CLIENT_ID` to both frontend and backend `.env` files
- Frontend also needs `VITE_API_URL`

### 3. Database Migration (if needed)
For existing users with passwords but no Google ID:
```javascript
// They can still login with email/password
// Google account can be linked later
```

## API Endpoints

### Register (Now Disabled)
```
POST /auth/register
Response: 403 - "Registration with email and password is not allowed. Please register using Google Sign-In."
```

### Google Authentication (Combined Login/Register)
```
POST /auth/google

Request Body:
{
  "token": "google_id_token",
  "role": "student|freelancer|startup|investor",  // Required for new users
  "mobile": "9876543210",                          // Required for new users
  "companyName": "Company Name"                    // Required if role is "startup"
}

Response (Success):
{
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "mobile": "9876543210",
  "role": "student",
  "isVerified": true,
  "profilePhoto": "google_photo_url",
  "token": "jwt_token"
}

Response (New User Missing Fields):
{
  "message": "Role is required for registration",
  "isNewUser": true
}
```

## User Flow

### Registration
1. User clicks "Register"
2. Clicks Google Sign-In button
3. Completes Google authentication
4. Selects role and enters mobile number
5. (Optional) Enters company name if role is "startup"
6. Account created with Google profile

### Login
1. User clicks "Login"
2. Clicks Google Sign-In button (primary option)
3. Completes Google authentication
4. Logged in if account exists
5. Alternative: Toggle to email/password login if needed

## Security Notes

- OAuth users receive random passwords for database compliance
- Mobile numbers are unique and validated
- Google provides email verification
- Tokens are JWT-based
- All Google tokens are validated server-side

## Testing

### Test Registration Flow
```bash
1. Go to /register
2. Click Google Sign-In
3. Complete Google auth
4. Select role and enter mobile
5. Submit
```

### Test Login Flow
```bash
1. Go to /login
2. Click Google Sign-In (recommended)
3. Or toggle to email/password login
```

### Test with Existing Email/Password Users
- They can login with email/password
- Google account will be linked on first Google login

## Rollback (if needed)

If you need to revert to traditional registration:
1. Restore original `register` function in `authController.js`
2. Restore original `Login.jsx` and `Register.jsx`
3. Update User model to make password required again
4. Update register endpoint validation

## Notes

- Mobile number is required for all new registrations via Google
- Existing users with passwords can still login traditionally
- Google accounts can be linked to existing email/password accounts
- Profile photos from Google are automatically used
- Company information is captured for startup accounts during registration
