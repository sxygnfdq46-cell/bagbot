# Authentication UI Implementation Guide

## Overview
BAGBOT's authentication system provides a futuristic, neon-themed user experience for login, signup, and password reset flows with secure token-based authentication.

---

## Pages

### 1. Login Page (`/auth/login`)

**Route**: `/auth/login`

**Layout**:
```
┌─────────────────────────────┐
│    Background Effects       │
│  (Pulsing Cyan/Magenta)     │
│                             │
│  ┌───────────────────┐      │
│  │     AI Orb        │      │
│  │  Welcome Back     │      │
│  │                   │      │
│  │  [Email Input]    │      │
│  │  [Password Input] │      │
│  │  □ Remember Me    │      │
│  │                   │      │
│  │  [Sign In Button] │      │
│  │                   │      │
│  │  Don't have       │      │
│  │  an account?      │      │
│  └───────────────────┘      │
│                             │
│  Secured by 256-bit         │
│  encryption                 │
└─────────────────────────────┘
```

**Features**:
- ✅ Email input with Mail icon
- ✅ Password input with Lock icon
- ✅ Show/hide password toggle (Eye/EyeOff icons)
- ✅ Remember me checkbox
- ✅ Forgot password link → `/auth/reset`
- ✅ Sign up link → `/auth/signup`
- ✅ Loading state with spinner
- ✅ Error alert panel for failed login
- ✅ Form validation (required fields)

**State Management**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**API Flow**:
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store token and redirect
    localStorage.setItem('auth_token', data.token);
    router.push('/');
  } catch (err: any) {
    setError(err.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**API Contract**:
```
POST /api/auth/login
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (Success):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "trader_pro",
    "tier": "pro"
  }
}

Response (Error):
{
  "message": "Invalid credentials",
  "code": "AUTH_FAILED"
}
```

**Visual Effects**:
- Animated background with 2 pulsing orbs (cyan/magenta)
- Input focus: Cyan border + ring effect
- Button hover: Glow intensification
- Loading: Spinner replaces button text

---

### 2. Signup Page (`/auth/signup`)

**Route**: `/auth/signup`

**Two-Step Flow**:

#### Step 1: Account Creation
```
┌─────────────────────────────┐
│     Create Your Account     │
│  ─────────────────────────  │
│  ● Account        ○ Plan    │
│  ─────────────────────────  │
│                             │
│  [Username Input]           │
│  [Email Input]              │
│  [Password Input]           │
│  [Confirm Password]         │
│                             │
│  [Continue to Plan]         │
│                             │
│  Already have account?      │
└─────────────────────────────┘
```

#### Step 2: Tier Selection
```
┌─────────────────────────────────────────┐
│         Choose Your Plan                │
│  ─────────────────────────────────────  │
│  ✅ Account       ● Plan                │
│  ─────────────────────────────────────  │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │Starter │ │  Pro   │ │Enterprise│     │
│  │  Free  │ │  $99   │ │  $299    │     │
│  │        │ │⭐ Popular│ │         │     │
│  │✓ 3 str │ │✓ ∞ str │ │✓ All Pro │     │
│  │✓ Basic │ │✓ Adv.  │ │✓ Custom  │     │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  [Back]  [Create Account]               │
└─────────────────────────────────────────┘
```

**Tier Options**:

| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|------------|
| Price | Free | $99/mo | $299/mo |
| Active Strategies | 3 | Unlimited | Unlimited |
| Analytics | Basic | Advanced | Advanced |
| Support | Email | Priority | Dedicated |
| Exchanges | 1 | Unlimited | Unlimited |
| AI Assistant | ❌ | ✅ | ✅ |
| Custom Strategies | ❌ | ❌ | ✅ |
| White Label | ❌ | ❌ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| SLA | ❌ | ❌ | ✅ |

**State Management**:
```typescript
const [step, setStep] = useState<'account' | 'tier'>('account');
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});
const [selectedTier, setSelectedTier] = useState('pro');
```

**Validation Rules**:
- Username: 3-20 characters
- Email: Valid format
- Password: Min 8 characters
- Confirm Password: Must match password

**Progress Indicator**:
```tsx
<div className="flex items-center gap-4">
  <div className={step === 'account' ? 'text-cyan-400' : 'text-green-400'}>
    <div className="w-8 h-8 rounded-full border-2">
      {step === 'tier' ? <Check /> : '1'}
    </div>
    Account
  </div>
  <div className="w-16 h-0.5 bg-gray-700" />
  <div className={step === 'tier' ? 'text-cyan-400' : 'text-gray-500'}>
    <div className="w-8 h-8 rounded-full border-2">2</div>
    Plan
  </div>
</div>
```

**API Flow**:
```typescript
const handleSignup = async () => {
  setError('');
  setLoading(true);

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        tier: selectedTier,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    localStorage.setItem('auth_token', data.token);
    router.push('/');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**API Contract**:
```
POST /api/auth/signup
Request:
{
  "username": "trader_pro",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tier": "pro"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "username": "trader_pro",
    "email": "user@example.com",
    "tier": "pro",
    "created_at": "2024-11-24T12:00:00Z"
  }
}
```

---

### 3. Password Reset Page (`/auth/reset`)

**Route**: `/auth/reset`

**Two States**:

#### State 1: Email Input
```
┌─────────────────────────────┐
│      Reset Password         │
│                             │
│  Enter your email to        │
│  receive reset instructions │
│                             │
│  [Email Input]              │
│                             │
│  [Send Reset Link]          │
│  [Back to Login]            │
└─────────────────────────────┘
```

#### State 2: Success Confirmation
```
┌─────────────────────────────┐
│  ✅ Check Your Email        │
│                             │
│  We've sent password reset  │
│  instructions to your email │
│                             │
│  ℹ️ Link expires in 1 hour  │
│                             │
│  [Back to Login]            │
└─────────────────────────────┘
```

**State Management**:
```typescript
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);
```

**API Flow**:
```typescript
const handleReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Reset failed');
    }

    setSuccess(true);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**API Contract**:
```
POST /api/auth/reset-password
Request:
{
  "email": "user@example.com"
}

Response:
{
  "message": "Reset email sent",
  "expires_at": "2024-11-24T13:00:00Z"
}
```

**Email Template**:
```
Subject: Reset Your BAGBOT Password

Hi [username],

You requested to reset your password. Click the link below:

https://app.bagbot.ai/auth/reset-confirm?token=abc123xyz

This link expires in 1 hour.

If you didn't request this, ignore this email.

- BAGBOT Team
```

---

## Shared Components

### Background Effects
```tsx
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-magenta-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
</div>
```

### AIOrb Header
```tsx
<div className="flex justify-center mb-4">
  <AIOrb size="lg" thinking={false} />
</div>
<h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent">
  Welcome Back
</h1>
```

### Input with Icon
```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
  <input
    type="email"
    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
  />
</div>
```

### Show/Hide Password Toggle
```tsx
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
>
  {showPassword ? <EyeOff /> : <Eye />}
</button>
```

---

## Security Features

### Token Storage
```typescript
// Store JWT token securely
localStorage.setItem('auth_token', data.token);

// Include in API requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
}

// Clear on logout
localStorage.removeItem('auth_token');
```

### Token Validation
- Backend validates JWT signature
- Token expiration: 7 days
- Refresh token mechanism (future)

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (recommended)
- At least 1 number (recommended)
- At least 1 special character (recommended)

### Rate Limiting
- Max 5 failed login attempts per 15 minutes
- Max 3 password reset requests per hour
- CAPTCHA after 3 failed attempts (future)

---

## Error Handling

### Common Errors

**Login**:
- `AUTH_FAILED`: Invalid credentials
- `ACCOUNT_LOCKED`: Too many failed attempts
- `EMAIL_NOT_VERIFIED`: Email verification required

**Signup**:
- `EMAIL_EXISTS`: Email already registered
- `USERNAME_TAKEN`: Username not available
- `INVALID_TIER`: Invalid subscription tier
- `PAYMENT_REQUIRED`: Payment failed (Pro/Enterprise)

**Password Reset**:
- `EMAIL_NOT_FOUND`: Email not registered
- `RATE_LIMITED`: Too many requests
- `TOKEN_EXPIRED`: Reset link expired
- `TOKEN_INVALID`: Invalid or used token

**Error Display**:
```tsx
{error && (
  <AlertPanel
    type="error"
    title="Authentication Error"
    message={error}
  />
)}
```

---

## Routing & Navigation

### Navigation Flow
```
/auth/login
  → Login successful → / (dashboard)
  → Signup link → /auth/signup
  → Forgot password → /auth/reset

/auth/signup
  → Step 1: Account info
  → Step 2: Tier selection
  → Signup successful → / (dashboard)
  → Login link → /auth/login

/auth/reset
  → Email submitted → Success state
  → Back to login → /auth/login

/auth/reset-confirm?token=xyz
  → Enter new password
  → Reset successful → /auth/login
```

### Protected Routes
```typescript
// Middleware to check auth
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  
  if (!token && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  if (token && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

---

## Responsive Design

### Desktop (> 768px)
- Card width: 28rem (448px)
- Centered layout
- Full background effects

### Mobile (< 768px)
- Card width: 100% minus padding
- Reduced background effects
- Larger touch targets

---

## Accessibility

- Form labels: All inputs properly labeled
- Keyboard navigation: Tab through all fields
- Focus indicators: Cyan ring on focus
- Error announcements: Screen reader friendly
- ARIA labels: Descriptive for icons
- Color contrast: WCAG AA compliant

---

## Future Enhancements

1. **OAuth Integration**: Google, GitHub, Apple Sign In
2. **Email Verification**: Confirm email before full access
3. **CAPTCHA**: reCAPTCHA v3 on signup/login
4. **Biometric Auth**: Face ID/Touch ID support
5. **Password Strength Meter**: Visual strength indicator
6. **Magic Link Login**: Passwordless email login
7. **Social Proof**: "Join 10,000+ traders" counter
8. **Testimonials**: User reviews on signup page
9. **Onboarding**: Guided tour after first login
10. **Session Management**: View and revoke devices

---

*Last Updated: Phase 5.3*
*Status: Production Ready*
