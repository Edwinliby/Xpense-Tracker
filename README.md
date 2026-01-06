<div align="center">
  <img src="./assets/images/icon.png" alt="Xpense Logo" width="120" height="120" />
  <h1>Xpense</h1>
  <p><strong>Master your money with elegance.</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#contributors">Contributors</a>
  </p>

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)

</div>

<br />

**Xpense** is a modern, premium expense tracker designed to help you track your spending, manage budgets, and achieve financial goals with style. Built with performant React Native technology, it offers a seamless experience across mobile and web.

## Features

- **📊 Smart Analytics**: Visualize your spending habits with beautiful, interactive charts.
- **💰 Budget Management**: Set monthly budgets and get real-time alerts when you're close to limits.
- **🎯 Goals & Savings**: Create custom savings goals and track your progress automatically.
- **🏆 Gamification**: Earn achievements for good financial habits to stay motivated.
- **🌍 Multi-language Support**: Fully localized in English, Spanish, and Somali.
- **⚡ Offline-First**: Works perfectly without internet; syncs automatically when online.
- **📱 Cross-Platform**: Optimized for iOS, Android, and Web.
- **🔒 Secure Sync**: Powered by Supabase for reliable and secure data synchronization.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 52](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **State Management**: React Context & Hooks
- **Styling**: StyleSheet with Custom Theme System ([Geist Font](https://vercel.com/font))
- **Charts**: [react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)
- **Animations**: [Reanimated](https://docs.swmansion.com/react-native-reanimated/) & Layout Animations

## Getting Started

To run this project locally, follow these steps:

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone (for mobile testing)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Edwinliby/Xpense-Tracker.git
   cd Expense_Tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the App**
   ```bash
   npx expo start
   ```
   - Press `a` for Android
   - Press `i` for iOS (Mac only)
   - Press `w` for Web

## Contributors

Thanks to the amazing people who have contributed to this project!

<a href="https://github.com/Edwinliby/Xpense-Tracker/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Edwinliby/Xpense-Tracker" />
</a>

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Edwinliby">Edwin</a></sub>
</div>
