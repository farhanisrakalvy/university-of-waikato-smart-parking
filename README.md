# 🚗 University of Waikato Smart Parking App

A comprehensive React Native mobile application built with Expo for smart parking management at the University of Waikato. This cross-platform app enables users to find available parking spots, make real-time bookings, manage payments through a digital wallet, and handle secure authentication.

![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)
![Expo](https://img.shields.io/badge/Expo-54.0.0-000020.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)

## ✨ Features

- **🔐 User Authentication**: Secure login and registration with email verification
- **🅿️ Smart Parking**: Real-time parking spot discovery and booking system
- **💳 Digital Wallet**: Integrated wallet for seamless payment processing
- **🔄 Real-time Updates**: Live parking availability with instant notifications
- **📋 Booking Management**: Complete booking lifecycle management
- **🗺️ Interactive Maps**: Visual parking spot location with navigation support
- **👤 User Profile**: Comprehensive profile and preferences management
- **📱 Cross-Platform**: Native iOS, Android, and Web support

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Navigation**: Expo Router
- **Maps**: React Native Maps
- **State Management**: React Context API
- **Styling**: React Native StyleSheet

## Project Structure

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

### 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **VS Code** (recommended IDE) - [Download here](https://code.visualstudio.com/)
- **Git** (for version control) - [Download here](https://git-scm.com/)
- **Expo Go** app on your mobile device - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### ⚡ Quick Setup for VS Code Users

#### Method 1: One-Click Setup

1. **Open the project in VS Code**
   ```bash
   # Navigate to project directory
   cd "path/to/your/project/directory"
   
   # Open in VS Code
   code .
   ```

2. **Install recommended extensions** (VS Code will prompt you)
   - Expo Tools
   - TypeScript and JavaScript Language Features
   - React Native Tools
   - Prettier - Code formatter
   - ESLint

3. **Run the project using VS Code terminal**
   ```bash
   # Open terminal in VS Code (Ctrl+` or View > Terminal)
   
   # Install dependencies
   npm install
   
   # Start the development server
   npm run dev
   ```

#### Method 2: Command Line Setup

**For Windows (PowerShell):**
```powershell
# Navigate to project directory
cd "path\to\your\project\directory"

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Start the development server
npm run dev
```

**For macOS/Linux (Terminal):**
```bash
# Navigate to project directory
cd "path/to/your/project/directory"

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Start the development server
npm run dev
```

### 🛠 Step-by-Step Installation Guide

#### 1. Clone or Download the Project

**Option A: Clone with Git**
```bash
git clone https://github.com/farhanisrakalvy/university-of-waikato-smart-parking.git
cd university-of-waikato-smart-parking
```

**Option B: Download ZIP**
1. Download the project ZIP file
2. Extract to your desired location
3. Navigate to the project directory

#### 2. Verify Project Structure

Ensure you see these files in your project root:
```
📁 Your Project Directory/
├── 📁 app/                    # React Native screens
├── 📁 assets/                 # Images and static files
├── 📁 components/             # Reusable components
├── 📁 contexts/               # React contexts
├── 📁 hooks/                  # Custom hooks
├── 📁 lib/                    # Utility libraries
├── 📄 package.json            # Dependencies (MUST exist)
├── 📄 app.json               # Expo configuration
├── 📄 tsconfig.json          # TypeScript config
└── 📄 README.md              # This file
```

#### 3. Install Dependencies

```bash
# Check if you're in the correct directory
ls package.json

# Install all project dependencies
npm install

# Install Expo CLI globally (required)
npm install -g @expo/cli

# Verify installation
npx expo --version
```

#### 4. Set Up Environment Variables

Create a `.env.local` file in the project root directory:

```bash
# Create the environment file
touch .env.local  # On Mac/Linux
# OR
New-Item .env.local -ItemType File  # On Windows PowerShell
```

Add your Supabase configuration:
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Replace with your actual Supabase project details
# Get these from: https://supabase.com/dashboard > Your Project > Settings > API
```

#### 5. Start the Development Server

```bash
# Start the Expo development server
npm run dev

# Alternative command
npx expo start
```

### 📱 Running the App

Once the development server starts, you'll see a QR code and several options:

#### **Option 1: Physical Device (Recommended)**
1. **Install Expo Go** on your phone:
   - [📱 iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [🤖 Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR Code**:
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and scan the QR code

#### **Option 2: Web Browser**
```bash
# Press 'w' in the terminal or visit:
http://localhost:8081
```

#### **Option 3: Emulators** (Advanced)
```bash
# Android Emulator (requires Android Studio)
# Press 'a' in the terminal

# iOS Simulator (macOS only, requires Xcode)
# Press 'i' in the terminal
```

### 🎯 Success Indicators

✅ **Everything is working when you see:**
- QR code displayed in terminal
- "Metro waiting on exp://..." message
- App loads on your device/browser
- No red error messages

❌ **Common issues:**
- "ENOENT: no such file" → Wrong directory
- "Module not found" → Run `npm install`
- Red error screen → Check Supabase setup

## 🗄️ Supabase Backend Setup Guide

### Step 1: Create Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Sign up or log in** to your account
3. **Click "New Project"**
4. **Fill in project details:**
   ```
   Project Name: University of Waikato Smart Parking
   Organization: Your organization (or create new)
   Database Password: [Create a strong password - SAVE THIS!]
   Region: Choose closest to your location
   ```
5. **Click "Create new project"** (takes 2-3 minutes)

### Step 2: Set Up Database Schema

1. **Go to SQL Editor** in your Supabase dashboard
2. **Copy and paste this complete database setup:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parking spots table
CREATE TABLE IF NOT EXISTS public.parking_spots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(5,2) NOT NULL,
  spot_type TEXT CHECK (spot_type IN ('regular', 'disabled', 'electric')) DEFAULT 'regular',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parking_spot_id UUID REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_cost DECIMAL(8,2) NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved cards table
CREATE TABLE IF NOT EXISTS public.saved_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL, -- Store encrypted/tokenized
  cardholder_name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  brand TEXT NOT NULL, -- visa, mastercard, etc.
  last4 TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT, -- booking_id or payment_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample parking spots
INSERT INTO public.parking_spots (name, description, latitude, longitude, hourly_rate, spot_type) VALUES
('Library Parking - Spot A1', 'Near main library entrance', -37.7881, 175.3181, 3.50, 'regular'),
('Student Centre - B2', 'Close to student centre', -37.7875, 175.3175, 3.00, 'regular'),
('Accessible Parking - C1', 'Disability accessible spot near admin', -37.7885, 175.3185, 3.50, 'disabled'),
('EV Charging - D1', 'Electric vehicle charging station', -37.7879, 175.3179, 4.00, 'electric'),
('Sports Complex - E3', 'Near sports and recreation centre', -37.7890, 175.3190, 2.50, 'regular');

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Saved cards policies  
CREATE POLICY "Users can manage own cards" ON public.saved_cards
  FOR ALL USING (auth.uid() = user_id);

-- Wallet transactions policies
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Parking spots are publicly readable
CREATE POLICY "Anyone can view parking spots" ON public.parking_spots
  FOR SELECT USING (true);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Click "Run"** to execute the SQL

### Step 3: Enable Authentication

1. **Go to Authentication → Settings**
2. **Enable Email authentication** (should be enabled by default)
3. **Set Site URL to:** `http://localhost:8081` (for development)
4. **Add Redirect URLs:**
   ```
   http://localhost:8081
   https://your-app-name.vercel.app (if deploying)
   exp://localhost:8081 (for Expo Go)
   ```

### Step 4: Get Your API Keys

1. **Go to Settings → API**
2. **Copy these values** (you'll need them for your `.env.local` file):

```env
# Your Supabase Project Details
Project URL: https://xxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIs...
service_role key: eyJhbGciOiJIUzI1NiIs... (keep this secret!)
```

### Step 5: Configure Your App

**Update your `.env.local` file:**
```env
# Replace with your actual values from Step 4
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 6: Test the Connection

1. **Save your `.env.local` file**
2. **Restart your development server:**
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

3. **Test user registration:**
   - Open the app
   - Try creating a new account
   - Check your Supabase dashboard → Authentication → Users

### 🔧 Optional: Advanced Configuration

#### Email Templates
1. Go to **Authentication → Email Templates**
2. Customize signup and password reset emails

#### Database Backups
1. Go to **Settings → Database**
2. Enable automatic backups

#### API Rate Limiting
1. Go to **Settings → API**
2. Configure rate limiting as needed

## 📜 Available Commands

### Development Commands
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run dev` | Start development server with cache clearing | **Primary command for development** |
| `npm start` | Start development server | Alternative to npm run dev |
| `npx expo start` | Start Expo development server directly | When npm scripts don't work |
| `npx expo start --clear` | Start with cleared Metro cache | When facing cache issues |
| `npx expo start --web` | Run web version only | Testing web functionality |
| `npx expo start --android` | Run on Android device/emulator | Android development |
| `npx expo start --ios` | Run on iOS simulator | iOS development (macOS only) |

### Build Commands
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run build:web` | Build optimized web version | Preparing for web deployment |
| `npx expo build` | Build for production | Creating production builds |

### Utility Commands
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm install` | Install all dependencies | First setup or after pulling changes |
| `npm run lint` | Check code quality | Before committing code |
| `npx expo install --fix` | Fix dependency compatibility | Resolving version conflicts |
| `npx expo doctor` | Check project health | Troubleshooting issues |

### Troubleshooting Commands
| Command | Description | When to Use |
|---------|-------------|-------------|
| `rm -rf node_modules && npm install` | Fresh dependency install | Major dependency issues |
| `npx expo start --tunnel` | Use tunnel for remote testing | Testing on external devices |
| `npx expo r -c` | Start with cache clear (shorthand) | Quick cache clearing |

##  Key Features Implementation

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

## Development Guidelines

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

## Troubleshooting

### Common Issues

1. **Metro bundler issues** (InternalBytecode.js errors):
   ```bash
   # Clear Metro cache and restart
   npx expo start --clear
   
   # If errors persist, delete cache and reinstall
   rm -rf node_modules/.cache
   npm install
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

4. **Database schema errors**: If you see errors like "column does not exist" or "relation does not exist":
   
   **Wallet balance error: "column users.wallet_balance does not exist"**:
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;
   ALTER TABLE users ADD CONSTRAINT wallet_balance_nonnegative CHECK (wallet_balance >= 0);
   CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance);
   UPDATE users SET wallet_balance = 0.00 WHERE wallet_balance IS NULL;
   ```
   
   **Saved cards error: "relation public.saved_cards does not exist"**:
   ```sql
   CREATE TABLE IF NOT EXISTS saved_cards (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     card_number TEXT NOT NULL,
     card_holder_name TEXT NOT NULL,
     expiry_date TEXT NOT NULL,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
   
   **Run all migrations at once**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste all the SQL commands above
   - Click "Run" to execute

5. **Supabase connection errors**:
   - Check environment variables in `.env`
   - Verify API keys and project URL
   - Ensure network connectivity

## 🔧 Comprehensive Troubleshooting Guide

### 🚫 Metro Bundler Problems
**Symptoms:** Bundle failed to load, cache issues, module resolution errors
```bash
# Clear Metro cache and restart
npx expo start --clear

# Or use the npm script
npm run dev

# For persistent issues
rm -rf node_modules/.cache
npx expo start --clear
```

### 📦 Dependency Issues
**Symptoms:** Module not found, version conflicts, installation errors
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Fix Expo SDK compatibility
npx expo install --fix

# Check for outdated packages
npm outdated
```

### 🔤 TypeScript Errors
**Symptoms:** Type errors, compilation failures
- ✅ Verify `tsconfig.json` is properly configured
- ✅ Check all dependencies are installed: `npm install`
- ✅ Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- ✅ Clear VS Code workspace cache: `Ctrl+Shift+P` → "Developer: Reload Window"

### 🗄️ Advanced Supabase Troubleshooting
**Symptoms:** Authentication failures, database connection errors

**1. Environment Configuration:**
```bash
# Check .env file exists and has correct format
cat .env  # Linux/macOS
type .env  # Windows

# Verify environment variables are loaded
# Add console.log(process.env.EXPO_PUBLIC_SUPABASE_URL) in your app
```

**2. API Key Validation:**
- ✅ Confirm `EXPO_PUBLIC_SUPABASE_URL` format: `https://xxx.supabase.co`
- ✅ Verify `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the anon/public key (not service_role)
- ✅ Check keys don't have extra spaces or quotes

**3. Database Connection Testing:**
```sql
-- Test connection in Supabase SQL Editor
SELECT current_user, current_database();

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';
```

### 📱 Platform-Specific Issues

**iOS Simulator (macOS only):**
```bash
# Install iOS simulator
sudo xcode-select --install
npx expo run:ios
```

**Android Emulator:**
```bash
# Check Android Studio setup
npx expo run:android

# Alternative: Use physical device with Expo Go app
```

**Web Development:**
```bash
# Web-specific start
npx expo start --web

# Clear web cache
rm -rf .expo/web-cache
npx expo start --web --clear
```

### 🆘 Emergency Reset Procedures

**Complete Project Reset:**
```bash
# Nuclear option - fresh start
rm -rf node_modules
rm -rf .expo
rm package-lock.json
npm install
npx expo start --clear
```

**VS Code Issues:**
1. Close VS Code completely
2. Clear workspace cache: Delete `.vscode/` folder if it exists
3. Restart VS Code
4. Run: `Ctrl+Shift+P` → "Developer: Reload Window"

### Environment Setup Issues

- **Android**: Ensure Android Studio and SDK are properly installed
- **iOS**: Xcode and iOS Simulator (macOS only)
- **Node.js**: Use Node.js v16 or higher

### 🆘 Still Having Issues?
1. 📋 Run `npx expo doctor` to check project health
2. 🔍 Check [Expo Troubleshooting Guide](https://docs.expo.dev/troubleshooting/overview/)
3. 🗄️ Verify [Supabase Documentation](https://supabase.com/docs)
4. 💬 Check console logs in browser/device for specific error messages

##  License

This project is developed for the University of Waikato. All rights reserved.

## Contributing

This is a university project. For contributions or issues, please contact the development team.

## Support

For technical support or questions:
- Email: farhanisrakalvy1998@gmail.com
- Project Repository: [https://github.com/farhanisrakalvy/university-of-waikato-smart-parking](https://github.com/farhanisrakalvy/university-of-waikato-smart-parking)

## Version History

- **v1.0.0** - Initial release with core parking and wallet functionality
- Authentication system implementation
- Basic parking spot management
- Digital wallet integration
- Map integration for parking locations

---

Built with ❤️ for the University of Waikato Community
