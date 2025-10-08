# CMS Web Frontend

A React + TypeScript frontend application for the CMS Web project, built with Vite for fast development and optimized builds.

## Features

- **React 19** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing
- **Firebase** integration for authentication and data
- **ESLint** for code quality
- **Responsive design** with modern CSS

## Pages

- Landing Page
- Login/Authentication
- Admin Dashboard
- Student Dashboard

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your configuration:
   ```
   VITE_API_URL=http://localhost:4000
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This frontend is configured to deploy on Render as a Static Site.

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18+

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router DOM
- Firebase
- ESLint
