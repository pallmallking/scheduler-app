# Smart Scheduler — TODO

## Branding & Setup
- [x] Generate app icon/logo
- [x] Update theme colors (indigo primary, orange accent)
- [x] Update app.config.ts with app name and logo URL
- [x] Add all required icon mappings to icon-symbol.tsx

## Navigation & Tabs
- [x] Set up 3-tab layout: Calendar, Agenda, Settings
- [x] Configure tab icons and labels

## Data Layer
- [x] Define Event type/interface
- [x] Create EventsContext with AsyncStorage persistence
- [x] CRUD operations: create, read, update, delete events

## Calendar Screen
- [x] Monthly calendar grid component
- [x] Dot indicators for days with events
- [x] Selected day highlight
- [x] Month navigation (prev/next)
- [x] Selected day event list below calendar

## Agenda Screen
- [x] Grouped list of upcoming events by date
- [x] Event card component (title, time, color tag, reminder badge)
- [x] Empty state illustration
- [x] Pull-to-refresh

## Event Creation & Editing
- [x] New Event modal screen
- [x] Title input
- [x] Date picker
- [x] Start/End time pickers
- [x] Color tag selector (6 colors)
- [x] Reminder toggle + offset picker
- [x] Notes input
- [x] Save and Cancel actions
- [x] Edit Event modal (pre-populated form)

## Event Detail Screen
- [x] Display full event info
- [x] Edit button → Edit modal
- [x] Delete button with confirmation alert

## Reminders / Notifications
- [x] Request notification permissions on first launch
- [x] Schedule local notification on event save (if reminder enabled)
- [x] Cancel notification on event delete/edit

## Settings Screen
- [x] Default reminder time preference
- [x] Theme toggle (light/dark)
- [x] About section

## Polish
- [x] FAB with haptic feedback
- [x] Smooth modal transitions
- [x] Press states on all interactive elements
- [x] Empty states for calendar and agenda
