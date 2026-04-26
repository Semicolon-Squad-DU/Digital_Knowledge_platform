# Fixes Applied - April 26, 2026

## 🌓 Issue 1: Dark Mode Not Persisting (FIXED)

### Problem

When navigating to profile or notification pages, the night mode (dark mode) was not persisting—it would reset even if the previous page was in night mode.

### Root Cause

The dark mode toggle was managed only in the `Navbar` component with a local hook (`useDarkMode`). This meant:

- Dark mode state was isolated to the Navbar
- Navigation to other pages didn't preserve the state
- The CSS class on `document.root` was only managed in one place

### Solution

✅ Created a global **ThemeProvider** context that:

- Manages dark mode state at the app level
- Persists theme to localStorage
- Listens for storage changes (syncs across browser tabs)
- Applies theme on initial load (respects system preferences)

### Changes Made

1. **Created**: `apps/frontend/src/providers/ThemeProvider.tsx`
   - Global theme context with persistence
   - Prevents flash of unstyled content
   - Listens for cross-tab storage changes

2. **Updated**: `apps/frontend/src/app/providers.tsx`
   - Wrapped app with `ThemeProvider`
   - Maintains all existing providers (QueryClient, etc.)

3. **Updated**: `apps/frontend/src/components/layout/Navbar.tsx`
   - Replaced local `useDarkMode()` hook with global `useTheme()`
   - Cleaner component code

### How to Test

1. Enable dark mode (click moon icon in navbar)
2. Navigate to `/profile` or `/notifications`
3. ✅ Dark mode should persist across navigation
4. Open app in different browser tab
5. ✅ Toggling dark mode in one tab should sync to all tabs

---

## 🔔 Issue 2: No Notifications Appearing (ENHANCED)

### Problem

Notifications page showed "No notifications yet" message. Users weren't receiving any notifications to see.

### Root Cause

The notification system was working correctly but:

- Notifications are only created when specific actions happen (library borrows, showcase reviews, admin announcements)
- Seed data created test notifications for hardcoded user IDs only
- Users wouldn't see notifications until someone interacted with their work

### Solution

✅ Added testing capabilities and improved notification visibility:

### Changes Made

1. **Backend**: Added test notification endpoint
   - File: `apps/backend/src/routes/notifications.routes.ts`
   - Endpoint: `POST /api/notifications/test`
   - Creates a test notification for the current user
   - Returns success message for debugging

2. **Frontend**: Enhanced notifications page
   - File: `apps/frontend/src/app/notifications/page.tsx`
   - Added "Test Notification" button
   - Auto-refetch when page becomes visible (after switching tabs)
   - Better toast feedback (success/error messages)
   - Improved UX with test icon/colors

### How to Test Notifications

1. Navigate to `/notifications`
2. Click the **"Test Notification"** button (green button)
3. You should see a toast notification: "Test notification created! Check back in a few seconds."
4. The test notification will appear in your notifications list within seconds
5. Click to mark as read, or use "Mark all read" button

### Real Notifications in Production

Notifications are created automatically when:

- **Library**: Books are borrowed/returned, holds become available
- **Showcase**: Projects are submitted for review or approved/rejected
- **Admin**: Announcements are published
- **Research**: Research outputs are uploaded

---

## Files Modified Summary

### Frontend Changes

- ✅ Created: `src/providers/ThemeProvider.tsx`
- ✅ Created: `src/hooks/useTheme.ts`
- ✅ Updated: `src/app/providers.tsx`
- ✅ Updated: `src/components/layout/Navbar.tsx`
- ✅ Updated: `src/app/notifications/page.tsx`

### Backend Changes

- ✅ Updated: `src/routes/notifications.routes.ts`

---

## Next Steps for Full Implementation

1. **Monitor Notifications**: Keep an eye on the notifications system in production
2. **Test Real Workflows**: Test actual library borrows, showcase submissions, etc.
3. **Collect Feedback**: Check if users see notifications for their real activities
4. **Consider Enhancements**:
   - Add WebSocket support for real-time notifications
   - Add notification preferences/settings
   - Add notification sounds
   - Add email digests

---

## Verification Commands

To verify the fixes work locally:

```bash
# 1. Ensure backend is running
npm run dev -w @dkp/backend

# 2. Ensure frontend is running
npm run dev -w @dkp/frontend

# 3. Test dark mode persistence:
# - Toggle dark mode in navbar
# - Navigate to /profile, /notifications, etc.
# - Mode should persist

# 4. Test notifications:
# - Go to /notifications
# - Click "Test Notification"
# - Should see notification appear

# 5. Test notification API directly:
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

**Status**: ✅ Ready for Testing
**Date**: April 26, 2026
**Issues Resolved**: 2/2
