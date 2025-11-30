# Settings UI Implementation Guide

## Overview
The Settings page provides comprehensive system and account configuration across 6 major sections: Profile, API Keys, Notifications, Appearance, Subscription, and Security.

---

## Architecture

### Layout Structure
```
/app/settings/page.tsx
├── Header (System Info Bar)
├── Content Grid (4 columns)
│   ├── Sidebar (1 col) - Section Navigation
│   └── Content Area (3 cols) - Active Section
└── Footer
```

---

## Sections

### 1. Profile Settings

**Fields**:
- Username (text input)
- Email (email input)
- Timezone (dropdown select)

**Timezone Options**:
```typescript
<option value="UTC">UTC</option>
<option value="America/New_York">Eastern Time</option>
<option value="America/Los_Angeles">Pacific Time</option>
<option value="Europe/London">London</option>
<option value="Asia/Tokyo">Tokyo</option>
```

**State Management**:
```typescript
const [profile, setProfile] = useState({
  username: 'trader_pro',
  email: 'trader@bagbot.ai',
  timezone: 'UTC',
});
```

**Actions**:
- Save Profile button (cyan glow)
- Updates via PUT `/api/user/profile`

---

### 2. API Keys Management

**Display Format**:
```typescript
interface APIKey {
  id: string;
  exchange: string;  // 'Binance', 'Bybit', 'Coinbase', etc.
  status: 'active' | 'inactive' | 'error';
  lastUsed: string;  // '2 hours ago', '5 minutes ago'
}
```

**Card Layout**:
```
┌─────────────────────────────────────┐
│ 🔑 Binance           Active  ✅ Edit │
│ Last used: 2 hours ago      Remove  │
└─────────────────────────────────────┘
```

**Actions**:
- **Edit**: Opens modal with API key/secret fields
- **Remove**: Confirmation dialog → DELETE `/api/keys/{id}`
- **Add New**: Opens creation modal → POST `/api/keys`

**Status Badge Colors**:
- Active: Green
- Inactive: Gray
- Error: Red

---

### 3. Notifications Settings

**Toggle Options**:
```typescript
const [notifications, setNotifications] = useState({
  tradeExecuted: true,      // Trade execution alerts
  riskAlert: true,          // Risk warnings and circuit breaker
  dailyReport: true,        // Daily performance summary
  systemErrors: true,       // System errors and failures
  marketNews: false,        // Market news updates
});
```

**Toggle Component**:
```tsx
<button
  onClick={() => setNotifications({ ...notifications, [key]: !value })}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    value ? 'bg-cyan-500' : 'bg-gray-700'
  }`}
>
  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    value ? 'translate-x-6' : 'translate-x-1'
  }`} />
</button>
```

**API Integration**:
- Save via PUT `/api/user/notifications`
- Real-time update in backend

---

### 4. Appearance/Theme Settings

**Options**:

**Theme Mode**:
```typescript
const modes = ['dark', 'darker', 'midnight'];
```
- Dark: Default high-contrast
- Darker: Reduced brightness
- Midnight: Pure black for OLED

**Glow Intensity**:
```typescript
const intensities = ['low', 'medium', 'high', 'extreme'];
```
- Low: Subtle 10px blur
- Medium: Standard 20px blur (default)
- High: Bold 30px blur
- Extreme: Maximum 50px blur

**Animations Toggle**:
- Enable/Disable smooth transitions and effects
- Improves performance on lower-end devices

**State**:
```typescript
const [theme, setTheme] = useState({
  mode: 'dark',
  glowIntensity: 'medium',
  animations: true,
});
```

**Implementation**:
- Updates CSS custom properties globally
- Saved to localStorage + backend
- Applied via Tailwind config

---

### 5. Subscription & Billing

**Display Components**:

**Current Tier Card**:
```
┌─────────────────────────────────┐
│ Pro Tier                   $99  │
│                          /month │
│ Full access to all features     │
│                                 │
│ Billing: Monthly                │
│ Next payment: Dec 24, 2025      │
└─────────────────────────────────┘
```

**Usage Metrics** (4-grid):
```
Active Strategies     API Calls (24h)
10 / ∞               45,231

Data Storage          Support Level
2.4 GB               Priority
```

**Actions**:
- **Manage Billing**: Opens Stripe portal
- **Change Plan**: Opens tier comparison modal
- **Cancel Subscription**: Confirmation → downgrade to Free

**Tier Comparison** (Modal):
| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|------------|
| Strategies | 3 | ∞ | ∞ |
| Analytics | Basic | Advanced | Advanced |
| Support | Email | Priority | Dedicated |
| Price | Free | $99/mo | $299/mo |

---

### 6. Security Settings

**Components**:

**Two-Factor Authentication**:
```tsx
<AlertPanel
  type="info"
  title="Two-Factor Authentication"
  message="2FA is currently disabled. Enable it for enhanced account security."
/>
<NeonButton glowColor="green" className="gap-2">
  <Shield className="w-4 h-4" />
  Enable 2FA
</NeonButton>
```

**Active Sessions**:
```
Current Session                    Active
macOS • Chrome • San Francisco, CA
```

**Recent Activity** (Last 10):
```
Login               2 hours ago
API Key Updated     1 day ago
Password Changed    3 days ago
```

**API Integration**:
- GET `/api/user/sessions` - Active sessions
- POST `/api/user/2fa/enable` - Enable 2FA
- POST `/api/user/2fa/verify` - Verify 2FA code
- DELETE `/api/user/sessions/{id}` - Revoke session

---

## Navigation

### Sidebar

**Structure**:
```tsx
const SETTINGS_SECTIONS = [
  { id: 'profile', title: 'Profile', icon: Settings, description: '...' },
  { id: 'api', title: 'API Keys', icon: Key, description: '...' },
  { id: 'notifications', title: 'Notifications', icon: Bell, description: '...' },
  { id: 'theme', title: 'Appearance', icon: Palette, description: '...' },
  { id: 'subscription', title: 'Subscription', icon: CreditCard, description: '...' },
  { id: 'security', title: 'Security', icon: Shield, description: '...' },
];
```

**Active Section Styling**:
```css
bg-cyan-500/20
text-cyan-400
border border-cyan-500/30
```

**Inactive Section Styling**:
```css
text-gray-400
hover:bg-gray-800/50
```

---

## System Info Bar

**Located**: Top of page, below header

**Display**:
```
ℹ️ BAGBOT v2.0.0              All Systems Operational ✅
   Build 20251124 • Uptime: 47h 23m
```

**Status Badge Colors**:
- Green: All systems operational
- Yellow: Partial outage
- Red: Major outage

**API**: GET `/api/system/info`
```json
{
  "version": "2.0.0",
  "build": "20251124",
  "uptime": 170580,
  "status": "operational"
}
```

---

## Responsive Design

### Desktop (> 1024px)
```
┌───────────────────────────────────┐
│ Header                            │
├─────┬─────────────────────────────┤
│ Nav │ Content                     │
│ (1) │ (3 cols)                    │
│     │                             │
└─────┴─────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌───────────────────────────────────┐
│ Header                            │
├─────┬─────────────────────────────┤
│ Nav │ Content                     │
│ (1) │ (2 cols)                    │
└─────┴─────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────┐
│ Header       │
├──────────────┤
│ Section      │
│ Selector     │
│ (Dropdown)   │
├──────────────┤
│ Content      │
│ (Full Width) │
└──────────────┘
```

---

## Form Validation

### Profile
- Username: 3-20 characters, alphanumeric + underscore
- Email: Valid email format
- Timezone: Must be valid IANA timezone

### API Keys
- Exchange: Required
- API Key: 32-64 characters
- API Secret: 32-128 characters
- Permissions: Read + Trade (checkboxes)

### Notifications
- At least one notification type must be enabled

### Theme
- All options have valid defaults

---

## API Endpoints

```
GET    /api/user/profile          - Fetch user profile
PUT    /api/user/profile          - Update profile
GET    /api/user/keys             - List API keys
POST   /api/user/keys             - Add API key
PUT    /api/user/keys/{id}        - Update API key
DELETE /api/user/keys/{id}        - Remove API key
GET    /api/user/notifications    - Get notification settings
PUT    /api/user/notifications    - Update notifications
GET    /api/user/theme            - Get theme settings
PUT    /api/user/theme            - Update theme
GET    /api/user/subscription     - Get subscription details
POST   /api/user/subscription/portal - Get Stripe billing portal URL
GET    /api/user/sessions         - List active sessions
DELETE /api/user/sessions/{id}   - Revoke session
POST   /api/user/2fa/enable       - Enable 2FA
POST   /api/user/2fa/verify       - Verify 2FA code
DELETE /api/user/2fa/disable      - Disable 2FA
GET    /api/system/info           - System version and status
```

---

## State Management

### Local State (useState)
- Form inputs and UI state
- Section navigation
- Modal visibility

### Global State (Context - Future)
- Theme settings (persistent across pages)
- User profile (accessible everywhere)
- Notification preferences

### Backend Sync
- Save on button click (manual save)
- Optimistic UI updates
- Error rollback on failure

---

## Error Handling

**Display Errors**:
```tsx
{error && (
  <AlertPanel
    type="error"
    title="Update Failed"
    message={error}
  />
)}
```

**Validation Errors**:
- Inline below input fields
- Red border on invalid inputs
- Prevent submission until valid

**Network Errors**:
- Retry button
- Fallback to cached values
- Show last successful save time

---

## Security Considerations

### API Key Storage
- **Never store in localStorage**
- Encrypted in backend database
- Only show masked keys (e.g., `sk_live_****abc123`)
- Require password confirmation before editing

### 2FA Setup Flow
1. Click "Enable 2FA"
2. Scan QR code with authenticator app
3. Enter 6-digit code to verify
4. Show recovery codes (download/print)
5. Confirm 2FA enabled

### Session Management
- Show device type, browser, location
- "This device" badge on current session
- Revoke all other sessions button
- Auto-logout after 30 days inactivity

---

## Accessibility

- Keyboard navigation: Tab through all inputs
- Focus visible: Cyan ring on focus
- Labels: All inputs have associated labels
- ARIA: Proper roles and descriptions
- Color contrast: WCAG AA compliant
- Screen reader: Descriptive text for toggles

---

## Future Enhancements

1. **Import/Export Settings**: JSON config download/upload
2. **Settings Search**: Quick find any setting
3. **Change History**: Audit log of all changes
4. **Bulk Actions**: Update multiple API keys at once
5. **Advanced Notifications**: Custom filters and channels (Slack, Discord, Telegram)
6. **Theme Preview**: Live preview before saving
7. **Keyboard Shortcuts**: Custom hotkey configuration
8. **Backup Codes**: For 2FA recovery
9. **IP Whitelist**: Restrict access by IP
10. **Webhook Settings**: Custom webhook endpoints for events

---

*Last Updated: Phase 5.3*
*Status: Production Ready*
