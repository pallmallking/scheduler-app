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

## Week View
- [x] WeekStrip component: horizontal 7-day header with day labels and date numbers
- [x] TimeGrid component: vertical 24-hour timeline with hour lines
- [x] Event blocks positioned by start/end time on the time grid
- [x] Toggle button to switch between Month and Week views on Calendar tab
- [x] Week navigation (prev/next week arrows)
- [x] Auto-scroll to current time on load
- [x] Tap event block → Event Detail screen
- [x] Tap empty time slot → New Event modal pre-filled with that date/time

## Drag-and-Drop Rescheduling (Week View)
- [x] Long-press event block to initiate drag
- [x] Floating ghost event block follows finger during drag
- [x] Snap ghost to nearest 15-minute interval
- [x] Highlight drop target column (day) and time slot during drag
- [x] Release to reschedule: update event date + startTime + endTime
- [x] Haptic feedback on drag start and successful drop
- [x] Visual feedback: dim original block while dragging
- [x] Cancel drag on release outside valid area (restore original position)
