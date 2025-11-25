## Main Frontend Technologies

| Technology               | Version | Purpose                                     |
| ------------------------ | ------- | ------------------------------------------- |
| **React**                | 19.1.0  | Core UI library                             |
| **Vite**                 | 6.3.5   | Build tool and dev server                   |
| **React Router**         | 7.8.2   | Client-side routing                         |
| **Redux Toolkit**        | 2.10.1  | Global state management                     |
| **TanStack React Query** | 5.90.10 | Server state caching & data fetching        |
| **Axios**                | 1.13.2  | HTTP client for API requests                |
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
│   │   ├── image.js         # Image upload endpoints
│   │   ├── map.js           # Map/reports endpoints
│   │   └── report.js        # Report CRUD endpoints
│   ├── assets/              # App assets
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── footer/      # Footer component
│   │   │   ├── header/      # Header with navigation
│   │   │   ├── layout/      # Page layout wrapper
│   │   │   └── logoutModal/ # Logout confirmation modal
│   │   └── pages/           # Page components
│   │       ├── admin/       # Admin dashboard & user creation
│   │       ├── home/        # Landing page
│   │       ├── inspectReport/# Report inspection view
│   │       ├── login/       # Login/Signup page
│   │       ├── map/         # Interactive map page
│   │       ├── relation-officer/  # PR officer dashboard
│   │       ├── report/      # Report submission form
│   │       └── technical-officer/ # Technical staff dashboard
│   ├── data/
│   │   ├── supabaseClient.js # Supabase client configuration
│   │   └── Turin_GEOJSON.json # City boundary data (fallback)
│   ├── images/              # Image assets
│   ├── store/               # Redux store
│   │   ├── store.js         # Store configuration
│   │   ├── locationSlice.js # Location state slice
│   │   └── reportSlice.js   # Report selection state slice
│   ├── styles/              # Global styles
│   │   ├── interface.css
│   │   ├── layout.css
│   │   └── variables.css
│   ├── App.jsx              # Main app with routing
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

| Module     | File        | Methods                                                                                                                         |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**   | `auth.js`   | `logIn`, `getUserInfo`, `logOut`, `signUp`                                                                                      |
| **Admin**  | `admin.js`  | `getAllRoles`, `createMunicipalityUser`, `getAllOperators`, `getAllOffices`                                                     |
| **Map**    | `map.js`    | `getAllApprovedReports`                                                                                                         |
| **Report** | `report.js` | `insertReport`, `getAllCategories`, `updateReportStatus`, `getAllPendingReports`, `getOperatorsByOffice`, `setOperatorByReport` |
| **Image**  | `image.js`  | `getImageUploadUrl`, `uploadImageToSignedUrl`                                                                                   |

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

#### Usage Example: City Boundaries (`cityBoundaries.js`)

The `useCityBoundaries` hook fetches Turin's city boundaries from the Overpass API and caches them so that we don't need to load it again every time we navigate to the map page:

```javascript
import { useQuery } from "@tanstack/react-query";

export const useCityBoundaries = () => {
  return useQuery({
    queryKey: ["cityBoundaries"],
    queryFn: loadCityBoundaries, // Fetches from Overpass API
  });
};

// In MapPage.jsx
const {
  data: cityBoundariesData,
  isLoading: boundariesLoading,
  error: boundariesError,
} = useCityBoundaries();
```

**Benefits:**

- City boundary data is fetched once and cached for 24 hours
- Subsequent page visits use cached data (instant load)
- Automatic retry on network failures

---

## Pages & Components

### Common Components

| Component     | Location                         | Description                     |
| ------------- | -------------------------------- | ------------------------------- |
| `Layout`      | `components/common/layout/`      | Page wrapper with header/footer |
| `Header`      | `components/common/header/`      | Navigation bar with user info   |
| `Footer`      | `components/common/footer/`      | Page footer                     |
| `LogoutModal` | `components/common/logoutModal/` | Logout confirmation dialog      |

### Pages

| Page                   | Route               | Description                                         |
| ---------------------- | ------------------- | --------------------------------------------------- |
| `HomePage`             | `/`                 | Landing page for unauthenticated users              |
| `LoginPage`            | `/login`, `/signup` | Authentication forms                                |
| `MapPage`              | `/map`              | Interactive map to view reports and select location |
| `InsertReportPage`     | `/create_report`    | Report submission form                              |
| `AdminPage`            | `/admin`            | Admin dashboard                                     |
| `CreateUserPage`       | `/admin/createuser` | Create municipal staff accounts                     |
| `RelationOfficerPage`  | `/relationOfficer`  | PR officer dashboard                                |
| `TechnicalOfficerPage` | `/technicalOfficer` | Technical staff dashboard                           |
| `InspectReportPage`    | `/inspectReport`    | Detailed report view                                |

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
    <Route path="/admin" element={<AdminPage />} />
    {/* ... more routes */}
  </Route>
</Routes>
```

**Role-Based Routing:**

- **Admin** → Redirects to `/admin`
- **Municipal public relations officer** → `RelationOfficerPage`
- **Technical office staff member** → `TechnicalOfficerPage`
- **Regular citizen** → `MapPage`
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
