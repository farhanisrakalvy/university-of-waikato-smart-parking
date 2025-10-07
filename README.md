<<<<<<< HEAD
# University of Waikato Smart Parking App

A React Native mobile application built with Expo for smart parking management at the University of Waikato. This app allows users to find available parking spots, make bookings, manage payments through a digital wallet, and handle authentication.

## 📱 Features

- **User Authentication**: Secure login and registration system
- **Smart Parking**: Find and book available parking spots
- **Digital Wallet**: Top-up wallet balance and manage payments
- **Real-time Updates**: Live parking spot availability
- **Booking Management**: View and manage parking bookings
- **Interactive Maps**: Visual parking spot location and navigation
- **User Profile**: Manage personal information and preferences

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Navigation**: Expo Router
- **Maps**: React Native Maps
- **State Management**: React Context API
- **Styling**: React Native StyleSheet

## 📁 Project Structure

```
├── app/                          # App screens and navigation
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx            # Login screen
│   │   ├── signup.tsx           # Registration screen
│   │   └── index.tsx            # Auth landing page
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx            # Home screen
│   │   ├── bookings.tsx         # Bookings management
│   │   ├── profile.tsx          # User profile
│   │   └── topup.tsx           # Wallet top-up
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx          # 404 page
├── assets/                       # Static assets
│   └── images/                  # App icons and images
├── components/                   # Reusable components
│   ├── MapComponent.tsx         # Mobile map component
│   └── MapComponent.web.tsx     # Web map component
├── contexts/                     # React contexts
│   ├── AuthContext.tsx          # Authentication context
│   └── WalletContext.tsx        # Wallet management context
├── hooks/                        # Custom hooks
│   └── useFrameworkReady.ts     # Framework readiness hook
├── lib/                         # Libraries and utilities
│   └── supabase.ts             # Supabase configuration
├── supabase/                    # Database migrations
│   └── migrations/             # SQL migration files
├── app.json                     # Expo configuration
├── package.json                # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/farhanisrakalvy/university-of-waikato-smart-parking.git
   cd university-of-waikato-smart-parking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

### 📱 Running on Device/Emulator

- **iOS Simulator**: Press `i` in the terminal or scan QR code with Expo Go app
- **Android Emulator**: Press `a` in the terminal or scan QR code with Expo Go app
- **Physical Device**: Install Expo Go app and scan the QR code

## 🗄️ Supabase Setup Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Fill in project details:
   - Name: "University of Waikato Smart Parking"
   - Organization: Your organization
   - Database Password: Create a strong password
   - Region: Choose closest to your location

### 2. Database Setup

1. **Run Migrations**: 
   - Navigate to SQL Editor in Supabase Dashboard
   - Run the migration files in order:
     ```sql
     -- Run each file from supabase/migrations/ in chronological order:
     -- 20250801010532_floating_sound.sql
     -- 20250801020000_fix_user_email_uniqueness.sql
     -- 20250801030000_allow_public_parking_spots.sql
     -- 20250920010000_add_wallet_balance.sql
     -- 20250921100000_create_saved_cards_table.sql
     -- 20250921110000_add_wallet_balance.sql
     ```

2. **Configure Row Level Security (RLS)**:
   - Go to Authentication → Policies
   - Enable RLS for all tables
   - Create policies for user access control

### 3. Authentication Setup

1. **Configure Auth Providers**:
   - Go to Authentication → Settings
   - Configure email authentication
   - Set up redirect URLs for your app

2. **Email Templates** (Optional):
   - Customize email templates for signup/reset password
   - Go to Authentication → Email Templates

### 4. Get API Keys

1. Go to Settings → API
2. Copy the following:
   - Project URL
   - Anon (public) key
   - Service role key (keep secure)

### 5. Environment Configuration

Update your `.env.local` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Test Connection

Run this command to test your Supabase connection:
```bash
npx expo start
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS device/simulator |
| `npm run web` | Run web version |
| `npm run build` | Create production build |
| `npm run build:android` | Build Android APK |
| `npm run build:ios` | Build iOS app |

## 🎯 Key Features Implementation

### Authentication Flow
- User registration with email verification
- Secure login with password encryption
- Password reset functionality
- Session management with Supabase Auth

### Parking Management
- Real-time parking spot availability
- Interactive map with spot locations
- Booking system with time slots
- Payment integration through wallet

### Wallet System
- Digital wallet for parking payments
- Top-up functionality
- Transaction history
- Saved payment methods

### Database Schema

#### Main Tables:
- `users` - User profiles and information
- `parking_spots` - Available parking locations
- `bookings` - Parking reservations
- `wallet_transactions` - Payment history
- `saved_cards` - Stored payment methods

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error handling
- Use async/await for asynchronous operations

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to repository
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## 🚨 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **Node modules conflicts**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Expo CLI not found**:
   ```bash
   npm install -g @expo/cli
   ```

4. **Supabase connection errors**:
   - Check environment variables
   - Verify API keys and project URL
   - Ensure network connectivity

### Environment Setup Issues

- **Android**: Ensure Android Studio and SDK are properly installed
- **iOS**: Xcode and iOS Simulator (macOS only)
- **Node.js**: Use Node.js v16 or higher

## 📄 License

This project is developed for the University of Waikato. All rights reserved.

## 👥 Contributing

This is a university project. For contributions or issues, please contact the development team.

## 📞 Support

For technical support or questions:
- Email: farhanisrakalvy1998@gmail.com
- Project Repository: [https://github.com/farhanisrakalvy/university-of-waikato-smart-parking](https://github.com/farhanisrakalvy/university-of-waikato-smart-parking)

## 🔄 Version History

- **v1.0.0** - Initial release with core parking and wallet functionality
- Authentication system implementation
- Basic parking spot management
- Digital wallet integration
- Map integration for parking locations

---

Built with ❤️ for the University of Waikato Community
=======
# university-of-waikato-smart-parking
Smart parking mobile application for University of Waikato built with React Native, Expo, and Supabase. Features real-time parking spot availability, booking system, digital wallet, and user authentication.
>>>>>>> 483cc468092d421ba4398194596b657df31b2fa1
