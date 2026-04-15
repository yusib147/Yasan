# YaksonThreeSons Ltd - Premium Laptop Store

A premium web application for YaksonThreeSons Ltd, featuring high-end laptop sales with a smooth, cinematic user experience.

## Features

- **Premium Preloader**: Cinematic entry experience with asset tracking (images, videos, fonts).
- **Product Gallery**: High-quality product display with quick view specifications.
- **Real-time Search & Filters**: Easily find laptops by brand, condition, or specs.
- **Cart & Wishlist**: Persistent shopping experience.
- **Responsive Design**: Optimized for all devices with a focus on premium aesthetics.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore & Auth)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd yakson-three-sons
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore and Authentication (Google Login).
   - Copy your Firebase configuration and update `src/firebase.ts` or create a `firebase-applet-config.json`.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### GitHub

1. Create a new repository on GitHub.
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Netlify

This project is ready for Netlify deployment.

1. Connect your GitHub repository to Netlify.
2. The `netlify.toml` file is already configured with:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **SPA Redirects**: Handles client-side routing.
3. Netlify will automatically build and deploy your site on every push to `main`.

## License

Private - YaksonThreeSons Ltd.
