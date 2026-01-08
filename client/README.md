## Main Frontend Technologies

| Technology               | Version | Purpose                                     |
| ------------------------ | ------- | ------------------------------------------- |
| **React**                | 19.1.0  | Core UI library                             |
| **Vite**                 | 6.3.5   | Build tool and dev server                   |
| **React Router**         | 7.8.2   | Client-side routing                         |
| **Redux Toolkit**        | 2.10.1  | Global state management                     |
| **TanStack React Query** | 5.90.10 | Server state caching & data fetching        |
| **Axios**                | 1.13.2  | HTTP client for API requests                |
| **Socket.IO Client**     | 4.x     | Real-time WebSocket communication           |
| **Leaflet**              | 1.9.4   | Interactive maps                            |
| **Turf.js**              | 7.3.0   | Geospatial analysis                         |
| **Supabase JS**          | 2.80.0  | Backend-as-a-Service client (image storage) |
| **Day.js**               | 1.11.18 | Date manipulation                           |

---

## Project Structure

```
client/
├── public/                  # Static assets
│   └── logo.svg
├── src/
│   ├── API/                 # API layer (HTTP requests)
│   │   ├── API.js           # Unified API export
│   │   ├── admin.js         # Admin endpoints
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── axiosInstance.js # Axios configuration
│   │   ├── chat.js          # Chat endpoints (NEW)
│   │   ├── citizen.js       # Citizen profile endpoints
│   │   ├── comment.js       # Comment endpoints
│   │   ├── image.js         # Image upload endpoints
│   │   ├── maintainer.js    # Maintainer endpoints
│   │   ├── map.js           # Map/reports endpoints
│   │   ├── notification.js  # Notification endpoints (NEW)
│   │   ├── report.js        # Report CRUD endpoints
│   │   └── techofficer.js   # Technical officer endpoints
│   ├── assets/              # App assets
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── footer/      # Footer component
│   │   │   ├── header/      # Header with navigation, notifications & chats (UPDATED)
│   │   │   ├── imagePreviewModal/ # Fullscreen image slider modal
│   │   │   ├── layout/      # Page layout wrapper
│   │   │   └── logoutModal/ # Logout confirmation modal
│   │   └── pages/           # Page components
│   │       ├── admin/       # Admin dashboard, user creation & operator editing
│   │       ├── chats/       # Chat page for citizen-operator communication (NEW)
│   │       ├── home/        # Landing page
│   │       ├── inspectReport/# Report inspection view
│   │       ├── login/       # Login/Signup page
│   │       ├── maintainer/  # Maintainer dashboard
│   │       ├── map/         # Interactive map page (UPDATED with chat button)
│   │       ├── profile/     # User profile page (citizens only)
│   │       ├── relation-officer/  # PR officer dashboard
│   │       ├── report/      # Report submission form & comments page
│   │       ├── technical-officer/ # Technical staff dashboard
│   │       └── verify-email/ # Email verification page
│   ├── constants/           # Shared constants
│   │   └── statusMap.js     # Report status colors & labels
│   ├── context/             # React Context providers (NEW)
│   │   └── SocketContext.jsx # Socket.IO connection context
│   ├── data/
│   │   ├── supabaseClient.js # Supabase client configuration
│   │   └── Turin_GEOJSON.json # City boundary data (fallback)
│   ├── images/              # Image assets
│   ├── routes/              # Routing configuration
│   │   ├── AppRouter.jsx    # Main router with all routes
│   │   ├── ProtectedRoute.jsx # Route protection wrapper
│   │   └── RoleBasedHomePage.jsx # Role-based redirects
│   ├── store/               # Redux store
│   │   ├── store.js         # Store configuration
│   │   ├── locationSlice.js # Location state slice
│   │   └── reportSlice.js   # Report selection state slice
│   ├── styles/              # Global styles
│   │   ├── interface.css
│   │   ├── layout.css
│   │   └── variables.css
│   ├── App.jsx              # Main app with SocketProvider
│   ├── App.css
│   ├── main.jsx             # Application entry point
│   ├── index.css
│   └── queryClient.js       # TanStack Query configuration
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

The development server runs on `http://localhost:5173` by default.

---

## API Layer

### Axios Instance (`axiosInstance.js`)

Centralized Axios configuration with:

- **Base URL**: `http://localhost:3001`
- **Credentials**: Cookies sent with every request (`withCredentials: true`)
- **Request Interceptor**: Extensible for adding auth tokens
- **Response Interceptor**: Automatically extracts data from the response and handles errors

```javascript
// Example: Response is automatically unwrapped
const user = await API.getUserInfo(); // Returns the entire data directly, not { data: ... }
```

### API Modules

They are devided by the purpose we use them for:

| Module           | File              | Methods                                                                                                                                                                                                        |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**         | `auth.js`         | `logIn`, `getUserInfo`, `logOut`, `signUp`                                                                                                                                                                     |
| **Admin**        | `admin.js`        | `getAllRoles`, `createMunicipalityUser`, `getAllOperators`, `getAllCompanies`, `getCompanyCategories`, `addOperatorCategory`, `removeOperatorCategory`                                                         |
| **Map**          | `map.js`          | `getAllApprovedReports`                                                                                                                                                                                        |
| **Report**       | `report.js`       | `insertReport`, `getAllCategories`, `updateReportStatus`, `getAllPendingReports`, `getOperatorsByOffice`, `setOperatorByReport`, `setMaintainerByReport`, `autoAssignMaintainer`, `autoAssignTechnicalOfficer` |
| **Image**        | `image.js`        | `getImageUploadUrl`, `uploadImageToSignedUrl`                                                                                                                                                                  |
| **Tech Officer** | `techofficer.js`  | `getAllReportsForTechOfficer`, `getMyCategories`                                                                                                                                                               |
| **Maintainer**   | `maintainer.js`   | `getAssignedReportsForMaintainer`, `updateReportStatusByMaintainer`                                                                                                                                            |
| **Citizen**      | `citizen.js`      | `getCitizenProfile`, `updateCitizenProfile`, `requestVerificationCode`, `verifyEmail`, `checkValidateToken`                                                                                                    |
| **Comment**      | `comment.js`      | `getMessages`, `addMessage`, `getInternalComments`, `addInternalComment`                                                                                                                                       |
| **Notification** | `notification.js` | `getNotifications`, `getUnreadNotificationCount`, `markNotificationAsSeen`, `markAllNotificationsAsSeen`, `getReportMessages`, `sendReportMessage`                                                             |
| **Chat**         | `chat.js`         | `getChats`, `getChatDetails`, `getUnreadMessagesCount`, `markChatAsRead`                                                                                                                                       |

### Unified API Object (`API.js`)

All methods are re-exported through a single `API` object which can be used as:

```javascript
import API from "../API/API.js";

// Authentication
const user = await API.logIn({ username, password });
await API.logOut();

// Reports
const reports = await API.getAllApprovedReports();
await API.insertReport(reportData);
```

---

## State Management

The application uses a **dual state management approach**:

1. **Redux** — for client-side UI state (selected location, selected report)
2. **TanStack Query** — for server state caching (API data)

### Redux Store

**Location**: `/src/store/`

#### Store Configuration (`store.js`)

```javascript
import { configureStore } from "@reduxjs/toolkit";
import locationReducer from "./locationSlice";
import reportReducer from "./reportSlice";

export const store = configureStore({
  reducer: {
    location: locationReducer,
    report: reportReducer,
  },
});
```

#### Location Slice (`locationSlice.js`)

Manages the user-selected location on the map for report creation.

**State Shape:**

```javascript
{
  position: [lat, lng] | null,  // Array of coordinates
  address: string | null,        // Reverse-geocoded address
  coordinates: { lat, lng } | null
}
```

**Actions:**

- `setLocation(payload)` — Sets location data when user clicks on map
- `clearLocation()` — Clears location (on logout or report submission)

**Usage in Components:**

```javascript
// MapPage.jsx - Setting location on map click
import { useDispatch, useSelector } from "react-redux";
import { setLocation, clearLocation } from "../../../store/locationSlice";

const dispatch = useDispatch();
const location = useSelector((state) => state.location);

// On map click
dispatch(
  setLocation({
    position: [lat, lng],
    address: "Via Roma 1, Turin",
    coordinates: { lat, lng },
  })
);

// InsertReportPage.jsx - Reading location
const location = useSelector((state) => state.location);
console.log(location.address); // "Via Roma 1, Turin"
```

#### Report Slice (`reportSlice.js`)

Manages the currently selected report for viewing details after submission.

**State Shape:**

```javascript
{
  selected: object | null; // The selected report object
}
```

**Actions:**

- `setSelectedReport(report)` — Sets the selected report
- `clearSelectedReport()` — Clears selection

---

### TanStack Query (QueryClient)

**Location**: `/src/queryClient.js`

TanStack Query handles **server state** — caching API responses to avoid redundant requests.

#### Configuration

```javascript
import { QueryClient } from "@tanstack/react-query";

const HOURS = 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data never becomes stale automatically
      gcTime: 24 * HOURS, // Cache persists for 24 hours
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});
```

#### Provider Setup (`main.jsx`)

```javascript
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

<QueryClientProvider client={queryClient}>
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
</QueryClientProvider>;
```

#### Using Cached Data in Components

Once data is cached by TanStack Query, any component can access it instantly without re-fetching. Example from `MapPage.jsx`:

```javascript
// Fetch cached data via hook
const { data: cityBoundariesData, isLoading, error } = useCityBoundaries();
```

About creating a hook, read below.

**Key benefit**: On first visit, data loads from Overpass API (~2-5s). On subsequent visits within 24 hours, data loads instantly from cache.

---

## City Boundaries Module (`cityBoundaries.js`)

This module fetches and processes Turin's administrative boundaries for the map. It's used to:

- Restrict report creation to within city limits
- Display a gray overlay outside the city
- Set map bounds

**How it works:**

1. **Data Fetching** (`loadCityBoundaries`):

   - Queries [Overpass API](https://overpass-api.de/) for Turin municipality boundary (`admin_level=8`)
   - Tries 3 different Overpass servers for reliability (with 20s timeout each)
   - Parses OSM relation data and extracts outer way segments
   - Connects way segments into a closed polygon (handles reversed segments)

2. **Polygon Processing** (using Turf.js):

   - Cleans coordinates (removes duplicates)
   - Normalizes winding order (counter-clockwise for outer ring)
   - Calculates bounding box for map `maxBounds`

3. **Mask Creation** (`createMaskPolygon`):
   - Creates a world-covering polygon with the city as a "hole"
   - This renders as a gray overlay outside Turin on the map

**Returns:**

```javascript
{
  cityBoundaries: GeoJSON,  // City polygon for point-in-polygon checks
  cityBounds: [[lat, lng], [lat, lng]],  // SW and NE corners for map bounds
  maskPolygon: GeoJSON      // Inverted polygon for gray overlay
}
```

**React Hook** (`useCityBoundaries`):

```javascript
export const useCityBoundaries = () => {
  return useQuery({
    queryKey: ["cityBoundaries"],
    queryFn: loadCityBoundaries,
  });
};
```

---

## Pages & Components

### Common Components

| Component           | Location                               | Description                                                              |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `Layout`            | `components/common/layout/`            | Page wrapper with header/footer                                          |
| `Header`            | `components/common/header/`            | Navigation bar with notifications 🔔 and avatar menu (includes messages) |
| `Footer`            | `components/common/footer/`            | Page footer                                                              |
| `LogoutModal`       | `components/common/logoutModal/`       | Logout confirmation dialog                                               |
| `ImagePreviewModal` | `components/common/imagePreviewModal/` | Fullscreen image slider with navigation controls                         |

### Pages

| Page                   | Route                      | Description                                         |
| ---------------------- | -------------------------- | --------------------------------------------------- |
| `HomePage`             | `/`                        | Landing page for unauthenticated users              |
| `LoginPage`            | `/login`, `/signup`        | Authentication forms                                |
| `MapPage`              | `/map`                     | Interactive map to view reports and select location |
| `InsertReportPage`     | `/create_report`           | Report submission form                              |
| `ProfilePage`          | `/profile`                 | User profile editing (citizens only)                |
| `ChatsPage`            | `/chats`                   | Chat list and messaging (citizens & operators)      |
| `CommentsPage`         | `/report/:id/comments`     | Report comments view (internal and public)          |
| `AdminPage`            | `/admin`                   | Admin dashboard                                     |
| `CreateUserPage`       | `/admin/createuser`        | Create municipal staff accounts                     |
| `EditOperatorPage`     | `/admin/operator/:id/edit` | Edit operator categories and details                |
| `RelationOfficerPage`  | `/relationOfficer`         | PR officer dashboard                                |
| `TechnicalOfficerPage` | `/technicalOfficer`        | Technical staff dashboard                           |
| `MaintainerPage`       | `/maintainer`              | External maintainer dashboard                       |
| `InspectReportPage`    | `/inspectReport`           | Detailed report view                                |
| `VerifyEmailPage`      | `/verify-email`            | Email verification page                             |

---

## Routing

Routing is handled by React Router v7 in `App.jsx`:

```javascript
<Routes>
  <Route element={<DefaultLayout user={user} handleLogout={handleLogout} />}>
    <Route path="/" element={/* Role-based redirect */} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/map" element={user ? <MapPage /> : <Navigate to="/" />} />
    <Route path="/create_report" element={<InsertReportPage />} />
    <Route path="/profile" element={<ProfilePage />} /> {/* Citizens only */}
    <Route path="/admin" element={<AdminPage />} />
    {/* ... more routes */}
  </Route>
</Routes>
```

**Role-Based Routing:**

- **Admin** → Redirects to `/admin`
- **Municipal public relations officer** → `RelationOfficerPage`
- **Technical office staff member** → `TechnicalOfficerPage`
- **Regular citizen** → `MapPage` (also has access to `/profile`)
- **Unauthenticated** → `HomePage`

---

## Environment Variables

Create a `.env` file in the client root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Styling

- **CSS Modules** — Component-scoped styles (`*.module.css`)
- **CSS Variables** — Design tokens defined in `variables.css` (colors, shadows, radius, gradients)
- **Global Classes** — Reusable UI classes in `interface.css` (`.btn`, `.btn-primary`, `.pointer`, typography) and `layout.css` (`.page-container`)

---

## Real-time Features (WebSockets)

The application uses **Socket.IO** for real-time communication with the server.

### Socket Context (`SocketContext.jsx`)

A React Context that manages the WebSocket connection lifecycle.

```javascript
import { useSocket } from "../context/SocketContext";

function MyComponent() {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (message) => {
      console.log("Received message:", message);
    });

    return () => socket.off("new_message");
  }, [socket]);
}
```

**Connection Logic:**

- Connects when user is authenticated
- Sends `userId` and `userType` for authentication
- Automatically disconnects on logout
- Reconnects on page refresh if session is valid

### Notifications

Citizens receive real-time notifications when their report status changes.

**Header Component Features:**

- 🔔 Notification bell with unread count badge
- Dropdown list of recent notifications
- Click to navigate to the report on the map
- "Mark all as read" functionality

**Events Listened:**

- `new_notification` — New status update notification

### Chat System

Real-time messaging between citizens and technical officers.

**Header Component Features:**

- Unread messages badge displayed on the user avatar
- "Messages" button in avatar dropdown menu → `/chats` page
- Badge shows count of unread messages (synced in real-time)

**ChatsPage Features:**

- Left sidebar with chat list
- Right panel with active chat messages
- Real-time message delivery
- System messages for status changes (prefixed with 📋)

**Events Listened:**

- `new_message` — New chat message

**Events Emitted:**

- `join_report` — Join a report's chat room
- `leave_report` — Leave a report's chat room

### MapPage Integration

When clicking a notification:

1. User is redirected to `/map?reportId=X`
2. Map automatically centers on the report location
3. Report details modal opens automatically
4. "Open Chat" button in modal navigates to chat

### Deduplication

Messages received from multiple Socket.IO rooms (user room + report room) are deduplicated:

- Header tracks processed message IDs to prevent double-counting
- ChatsPage checks message ID before adding to list
