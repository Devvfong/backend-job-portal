# Notification Feature Specification

The notification system in Devqii is designed to be a dynamic, data-driven activity feed that keeps users engaged by highlighting relevant events in their job search or recruitment cycle.

## Core Architecture

- **Backend Logic**: Implemented in `notification.controller.js`. It does NOT require a separate database table for notifications; instead, it generates "virtual" notifications by querying existing business data (`Applications`, `Jobs`, etc.) in real-time.
- **Polling**: The frontend `NotificationBell.js` polls the API every 60 seconds to ensure a "live" feel without complex WebSocket infrastructure.
- **Read State**: Managed client-side via `Set` state to reduce backend complexity.

## Notification Types

### For Job Seekers (Candidates)
- **Application Status Updates**:
    - `Applied`: Confirmation of submission.
    - `Reviewed`: Recruiter viewed the application.
    - `Accepted`: User is hired or accepted.
    - `Rejected`: Application was unsuccessful.
- **Job Discovery**:
    - `New Job Match`: Alerts users to high-quality jobs posted in the last 72 hours.

### For Company Admins (Recruiters)
- **Applicant Tracking**:
    - `New Applicant`: Alerted immediately when a new candidate applies to one of their active listings.

## Visual Identity
- Each notification type is mapped to a specific **Lucide Icon** and **Tailwind Color Palette** (e.g., Star/Yellow for Acceptance, X/Red for Rejection).
- Glassmorphic dropdown panel aligns with the "System Matrix" aesthetic.
- Smart "Time Ago" formatting (e.g., "just now", "5m ago").

## API Endpoint
- `GET /api/v1/notifications`: Protected route that returns a tailored array of the 15 most recent relevant notifications.
