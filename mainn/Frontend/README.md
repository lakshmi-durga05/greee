# Uber Project Frontend

This repository contains the frontend implementation for the Uber Project. The project consists of various pages and components to deliver a seamless user experience for riders and captains.

---

## Features

- User and Captain Authentication
- Dynamic Landing Page
- Protected Routes for Users and Captains
- Live Ride Tracking
- Ride Payment Interface
- Recent Trips and Offers Display
- Vehicle and Ride Details Management

---

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd uber-project-frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

---

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open the application in your browser at `http://localhost:5173`.

---

## Project Structure

### Pages

The following pages are included in the project:

- **LandingPage**: Main entry point showcasing the application’s features.
- **UserLogin**: Login page for users.
- **CaptainLogin**: Login page for captains.
- **UserSignup**: Registration page for users.
- **CaptainSignup**: Registration page for captains.
- **UserHomePage**: User dashboard displaying ride options and details.
- **CaptainHome**: Captain dashboard for managing rides.
- **UserLogout**: Handles user logout.
- **CaptainLogout**: Handles captain logout.
- **ProtectedWrapper**: Ensures only authenticated users can access specific pages.
- **CaptainProtected**: Ensures only authenticated captains can access specific pages.
- **CaptainRiding**: Captain’s active ride management interface.
- **UserRideStarted**: Displays ride status for users after the ride starts.
- **PaymentPage**: Handles payment processing for completed rides.

### Components

Reusable components included in the project:

- **ScrollAnimation**: Adds animations to elements on scroll.
- **Header**: Navigation bar for the application.
- **Testimonials**: Displays user feedback.
- **DriverAcceptRide**: Interface for captains to accept rides.
- **VehicleDetails**: Displays details about the captain’s vehicle.
- **LookingForDriver**: Loader while searching for an available driver.
- **LocationInput**: Input fields for entering pickup and drop-off locations.
- **RecentTrips**: Displays a user’s past trips.
- **OffersSection**: Showcases ongoing offers and discounts.
- **ConfirmRide**: Allows users to confirm their ride details.
- **LiveTracking**: Displays real-time ride location on a map.
- **UserPaymentPopup**: Popup for users to make payments.

---

## Technologies Used

- **React.js**: Frontend library for building the user interface.
- **React Router**: For handling navigation and protected routes.
- **CSS Modules**: For styling components.
- **Axios**: For API communication.

---

## Environment Variables

Create a `.env` file in the root directory and configure the following variables:
- `VITE_BASE_URL`: Base URL for API requests.
- `REACT_APP_MAPS_API_KEY`: API key for the maps integration.

---

## Deployment

1. Build the project for production:
   ```bash
   npm run build
   ```
2. Deploy the `build` folder to your hosting provider.

---



