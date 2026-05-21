# Smart Scheduler — Mobile App Design

## Brand Identity
- **App Name:** Smart Scheduler
- **Tagline:** Stay on top of your day
- **Primary Color:** `#4F6BF4` (Indigo Blue) — conveys trust, focus, productivity
- **Accent Color:** `#F97316` (Warm Orange) — for reminders and alerts
- **Background:** `#FFFFFF` / `#0F1117` (dark)
- **Surface:** `#F4F6FF` / `#1A1D2E` (dark)
- **Success:** `#22C55E` / `#4ADE80`
- **Error:** `#EF4444` / `#F87171`

---

## Screen List

| # | Screen | Route |
|---|--------|-------|
| 1 | **Calendar** (Home) | `/(tabs)/index` |
| 2 | **Agenda / Today** | `/(tabs)/agenda` |
| 3 | **New Event** (modal) | `/event/new` |
| 4 | **Event Detail** | `/event/[id]` |
| 5 | **Edit Event** (modal) | `/event/edit/[id]` |
| 6 | **Settings** | `/(tabs)/settings` |

---

## Primary Content & Functionality

### 1. Calendar Screen (Home)
- Monthly calendar grid with dot indicators for event days
- Tapping a day shows that day's events in a bottom sheet / inline list
- Floating Action Button (FAB) to create a new event
- Current day highlighted with primary color circle
- Swipe left/right to navigate months

### 2. Agenda / Today Screen
- Chronological list of upcoming events grouped by date
- Each event card shows: title, time range, color tag, reminder badge
- Pull-to-refresh
- Empty state illustration when no events

### 3. New Event Modal
- Full-screen modal sheet
- Fields: Title, Date, Start Time, End Time, Color Tag, Reminder toggle + offset picker, Notes
- Save / Cancel buttons in header

### 4. Event Detail Screen
- Full event info: title, date/time, color, reminder, notes
- Edit and Delete actions in header
- Back navigation

### 5. Edit Event Modal
- Same form as New Event, pre-populated with existing data

### 6. Settings Screen
- Default reminder time preference
- Theme toggle (light/dark)
- About section

---

## Key User Flows

### Create Event
1. User taps FAB on Calendar or Agenda screen
2. New Event modal slides up
3. User fills in title, date, time, optional reminder
4. Taps "Save" → event stored in AsyncStorage → modal dismisses
5. Calendar dot and Agenda list update immediately

### View Events for a Day
1. User taps a date on the Calendar grid
2. Inline list below calendar animates in showing that day's events
3. User taps an event card → Event Detail screen

### Set a Reminder
1. In New/Edit Event form, user toggles "Reminder" switch ON
2. Picker appears: "5 min", "15 min", "30 min", "1 hour", "1 day" before
3. On save, a local notification is scheduled via expo-notifications

### Delete Event
1. On Event Detail screen, user taps Delete (trash icon)
2. Confirmation alert appears
3. On confirm, event removed from AsyncStorage + any scheduled notification cancelled

---

## Color Choices
- **Primary (Indigo):** `#4F6BF4` — tab active, FAB, selected day, primary buttons
- **Accent (Orange):** `#F97316` — reminder badges, warning states
- **Foreground:** `#1A1D2E` / `#F0F2FF`
- **Muted:** `#6B7280` / `#9CA3AF`
- **Border:** `#E2E8F0` / `#2D3148`
- **Surface:** `#F4F6FF` / `#1A1D2E`
- **Event Colors (tags):** Indigo, Teal, Rose, Amber, Emerald — user picks per event

---

## Layout Principles
- One-handed reachability: FAB bottom-right, tab bar at bottom
- Cards with 12px rounded corners, subtle shadow
- 16px horizontal padding on all screens
- Typography: SF Pro / System font, bold headers, regular body
- Smooth 250ms transitions for sheet open/close
