# Order Notification System

Implement a cross-platform notification system for new orders and status updates.

## Proposed Changes

### Database & Backend
- Add a `notifications` table to store order alerts.
- Update `createOrder` server function to:
    - Insert a notification for the admin.
    - Trigger a browser notification (Web Push or standard toast for active sessions).
- Update `updateOrder` server function to:
    - Insert a notification for the customer.
    - Optionally send an email/WhatsApp placeholder alert (as actual WhatsApp API requires external integration).

### Frontend (Admin)
- Implement a `NotificationBell` component in the admin header.
- Use `sonner` for real-time order alerts when the admin is active.
- Register a Service Worker to handle background push notifications for mobile/desktop.

### Frontend (Customer)
- Show real-time status update notifications if the user has the site open.
- Provide a "Track Order" link in notifications.

## Technical Details
- **Web Push API**: Request notification permissions in the admin panel.
- **Supabase Realtime**: Listen for new rows in the `notifications` table to trigger UI alerts.
- **Service Worker**: `/public/sw.js` to handle background data.
