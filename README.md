# RK Cab Platform 🚖

A full-stack, end-to-end ride-hailing application featuring a Python backend and a modern React frontend. This project was developed as a comprehensive engineering exercise to master full-stack architecture, secure authentication, and seamless API integration. 

*Note: Due to current cloud-hosting free-tier restrictions on platforms like Render and Railway, this application is configured and optimized for local demonstration and development.*

## Tech Stack

**Frontend Architecture:**
**Framework:** Next.js with React 18 (Client-side rendering focused)
**Styling:** Tailwind CSS for a highly responsive, modern UI 
**Mapping:** Leaflet.js for interactive, real-time map rendering 
**Authentication:** Clerk Auth for passwordless, OTP-based login 

**Backend Architecture:**
**Framework:** FastAPI (Python) for high-performance REST API routing 
**Database:** PostgreSQL (Hosted via Supabase) 
**ORM:** SQLAlchemy for robust data modeling and relational queries
**Utilities:** pure-Python `fpdf` library for OS-independent PDF receipt generation 

## Key Features

**Secure Authentication:** Passwordless OTP email login powered by Clerk, ensuring user data security without managing passwords locally
**Interactive Booking Dashboard:** Real-time map rendering using Leaflet.js to visualize pickup and drop-off locations dynamicall
**Automated Ride Simulation:** End-to-end ride lifecycle management (Requested → Completed) processed instantly by the FastAPI backend
**Financial UI Elements:** Integrated Promo Code application and Wallet Balance display for user retention metrics
**Post-Ride Engagement:** Ride history dashboard featuring an interactive 5-star driver rating system
**Digital Receipts:** On-demand, downloadable PDF receipts generated on the fly for completed rides

## Local Setup Instructions

Follow these steps to run the application perfectly on a Windows development environment.

### 1. Database Setup
Ensure you have a Supabase PostgreSQL connection string and a Clerk Publishable/Secret key ready in your `.env` files.

### 2. Backend (FastAPI) Setup
Open a terminal in the `backend` directory and run:

\`\`\`powershell
# Create a virtual environment
python -m venv env

# Activate the environment (Windows)
env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
\`\`\`
The backend will be running at `http://localhost:8000`.

### 3. Frontend (Next.js) Setup
Open a separate terminal in the `frontend` directory and run:

\`\`\`powershell
# Install Node modules
npm install

# Start the Next.js development server
npm run dev
\`\`\`
The frontend will be accessible at `http://localhost:3000`.

---
*Developed by Yash.*
