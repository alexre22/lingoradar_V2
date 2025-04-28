# 📄 Requirements for LingoRadar App

---

## 🌟 Must-Have Features

### 🔐 Authentication
- Sign up / Sign in with email and password (Supabase Auth)
- Forgot password recovery
- Logout (clear session)

---

### 👤 User Profile
- Profile fields:
  - Display name
  - Profile picture (upload and change)
  - Age
  - Gender (optional)
  - City (Dropdown: all **global cities**)
  - Native languages (multi-select)
  - Learning languages (multi-select)
  - Interests (tags or chip list)
  - Optional bio
- Edit own profile

---

### 👥 Community Tab (Tab 1)
- Filter users by:
  - Native language(s)
  - Learning language(s)
  - Interests
  - City
  - Age range
- Scrollable list of users
- Each user card:
  - Circular profile picture
  - Name
  - Language badges
  - "Send Message" button → opens 1:1 chat
- Tap on profile → view detailed user profile
- Modern feed style: clean, Instagram/Tinder inspired design

---

### 📺 Global Map Tab (Tab 2)
- Interactive world map (Mapbox)
- City aggregation:
  - Clustered markers showing number of users per city
- Filters:
  - Native language
  - Learning language
- Tap on city marker:
  - Jump to Community Tab showing users filtered by that city and native & learning language 

---

### 💬 Chats Tab (Tab 3)
- List of recent conversations:
  - Profile picture
  - Name
  - Last message preview
  - Timestamp
  - Unread message indicator (bold text or notification dot)
- 1:1 Chat window:
  - Scrollable message history
  - Polling every 10 seconds for new messages
  - Input field for typing and sending messages
  - Back button to return to chat list

---

### 👤 Profile Tab (Tab 4)
- Display and edit user's own profile
- Upload / change profile picture
- Logout button (returns to login screen)

---

## 🔊 Important Notes

- **Language**: Entire app UI is in **English** only
- **UI Style**: Modern, clean, social-network inspired (like TikTok, Instagram, Tinder)
- **Navigation**: Bottom tab bar with:
  - Community
  - Global Map
  - Chats
  - Profile
- **Data Refresh**: Manual refresh + lightweight background refresh (no real-time subscriptions yet)
- **Security**: Use Supabase **Row Level Security (RLS)** to secure user data access

---

## 🛠️ Tech Stack

| Layer        | Technology                     |
|--------------|---------------------------------|
| Frontend     | React Native (Expo)             |
| Backend      | Supabase (Postgres, Auth, Storage) |
| Logic        | Node.js (Supabase Edge Functions) |
| Map          | Mapbox                          |

