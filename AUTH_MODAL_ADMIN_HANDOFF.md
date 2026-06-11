# Auth Modal and Admin URL Handoff

Current branch: `feature/mobile-otp-email-verification-auth`

Current git state before this handoff file: clean.

Latest local commits:

- `c9d7c40 Show customer auth as storefront modal`
- `d52106a Add mobile OTP and email verification auth flow`

## Completed Backend Changes

Commit: `d52106a Add mobile OTP and email verification auth flow`

Implemented phone OTP and email verification support.

Main backend files changed:

- `Backend/Ecommerce.Domain/Entities/User.cs`
  - Added `PhoneNumber`.
  - Added `IsPhoneNumberVerified`.
  - Added `IsEmailVerified`.
  - Added phone OTP hash, expiry, failed attempt count, and lockout fields.
  - Added email verification token hash and expiry fields.

- `Backend/Ecommerce.Application/Services/Identity/AuthService.cs`
  - Added mobile OTP request flow.
  - Added mobile OTP verify flow.
  - Added 3 failed OTP attempt lockout.
  - Lockout message is exactly:
    `Sorry, Number of attempts exhausted please try again after 1 hr.`
  - Added email verification link generation and verification.
  - OTP and email tokens are hashed before storing.
  - Current OTP delivery is logger-backed for local development. Real SMS provider is still pending.

- `Backend/Ecommerce.Api/Controllers/Identity/AuthController.cs`
  - Added `POST /api/v1/Auth/phone-otp/request`.
  - Added `POST /api/v1/Auth/phone-otp/verify`.
  - Added `POST /api/v1/Auth/email-verification/send`.
  - Added `POST /api/v1/Auth/email-verification/verify`.

- `Backend/Ecommerce.Infrastructure/Configurations/UserConfiguration.cs`
  - Added unique filtered index for `PhoneNumber`.

- `Backend/Ecommerce.Infrastructure/Migrations/20260610074517_AddPhoneOtpAndEmailVerification.cs`
  - Adds the database columns for phone OTP and email verification.

- `Backend/Ecommerce.Api/appsettings.Development.json`
  - `EmailSettings:FrontendUrl` was changed to `http://localhost:5173`.
  - `AllowedOrigins` already includes `http://localhost:5174` locally.
  - This file may not show as changed if the current local value already has it.

Backend verification already done before the second follow-up:

- `dotnet build Ecommerce.sln` passed.
- `dotnet test Ecommerce.sln --no-build` passed.
- Live API phone OTP request worked.
- Three wrong OTP attempts returned the exact 1-hour lockout message.

## Completed Frontend Changes

Commit: `c9d7c40 Show customer auth as storefront modal`

Changed customer login/signup from a standalone page to a modal overlay above the existing storefront page.

Main frontend files changed:

- `Frontend/src/features/auth/AuthModal.tsx`
  - New customer login/signup modal.
  - Matches the uploaded Louis Philippe-style behavior: page stays behind the modal with dark overlay.
  - Supports mobile number entry, OTP entry, email verification prompt, close button, and brand strip.
  - Admin login has been removed from the customer modal.

- `Frontend/src/layouts/MainLayout.tsx`
  - Mounts `AuthModal`.
  - Opens modal when URL has `?auth=login`.
  - Header account icon opens the modal for guests instead of navigating to `/login`.
  - Closes modal by removing `auth` and `redirectTo` query params.

- `Frontend/src/features/auth/LoginPage.tsx`
  - No longer renders a login page.
  - Redirects `/login` to `/?auth=login&redirectTo=...`.

- `Frontend/src/features/auth/RegisterPage.tsx`
  - Reuses the login redirect behavior.

- Customer protected redirects updated to open modal:
  - `Frontend/src/features/auth/UserRoute.tsx`
  - `Frontend/src/features/wishlist/useWishlistProduct.ts`
  - `Frontend/src/features/checkout/CheckoutPage.tsx`
  - `Frontend/src/features/catalog/ProductDetailPage.tsx`
  - `Frontend/src/features/cart/CartPage.tsx`
  - `Frontend/src/features/account/AccountPage.tsx`
  - `Frontend/src/features/auth/ForgotPasswordPage.tsx`

- `Frontend/src/features/admin/AdminLoginPage.tsx`
  - New separate admin login page.
  - Uses email/password login.
  - Rejects non-admin users on the client after login response.

- `Frontend/src/features/admin/AdminRoute.tsx`
  - Redirects unauthenticated admin route access to `/admin-login`.

- `Frontend/src/features/admin/AdminLayout.tsx`
  - Admin logout redirects to `/admin-login`.

- `Frontend/src/App.tsx`
  - Adds `/admin-login`.
  - Detects `window.location.port === '5174'`; if root is opened on port 5174, it redirects to `/admin`.

- `Frontend/package.json`
  - Added script:
    `dev:admin`: `vite --host localhost --port 5174`

- `Frontend/src/features/auth/UserRoute.test.tsx`
  - Updated test expectation to the new storefront auth modal redirect host.

Frontend verification already completed:

- First `npm run build:check` failed inside sandbox because Vite/Tailwind native Windows dependency loading was blocked:
  - `spawn EPERM`
  - `@tailwindcss/oxide-win32-x64-msvc`
- Reran outside sandbox with escalation.
- `npm run build:check` passed.
- `npm test -- UserRoute.test.tsx` passed.

## Current Stopping Point

The last work stopped while trying to start and verify the separate admin dev server at:

`http://localhost:5174`

What happened:

- `npm run dev:admin` was added.
- `Start-Process npm.cmd ...` initially did not leave a listening server on `5174`.
- A second `Start-Process` attempt with redirected logs failed with:
  `Start-Process : Item has already been added. Key in dictionary: 'Path' Key being added: 'PATH'`
- Running `npm run dev:admin` in foreground appeared to stay alive until timeout, but after the timeout there was still no listener found on `5174`.
- User interrupted before this was fully diagnosed.

The likely next check:

1. Run this manually in a normal terminal:
   `cd "C:\Visual Studio 2022\Ecommerce\Frontend"`
2. Run:
   `npm run dev:admin`
3. Confirm Vite prints a local URL for `http://localhost:5174`.
4. Open:
   `http://localhost:5174/admin-login`

If it still does not listen, inspect the foreground terminal output. The hidden start path may be the problem, not the app code.

## Production Answer About Separate Admin URL

Using a different admin URL will not inherently cause production issues if configured properly.

Recommended production shape:

- Customer storefront:
  `https://urbaniq.com`

- Admin console:
  `https://admin.urbaniq.com`

Required production work:

- Add admin origin to backend CORS.
- Configure HTTPS/TLS for both domains.
- Make token/cookie strategy compatible with separate origins.
- If using localStorage bearer tokens, separate origin is mostly straightforward.
- If moving to secure cookies later, configure cookie domain, `SameSite=None`, `Secure`, and CSRF protection carefully.
- Protect admin routes on the backend with role checks. Hiding admin behind a different URL is not security by itself.
- Production build/deploy should either:
  - deploy the same frontend app with host-based routing, or
  - deploy a separate admin frontend bundle.

For current local development:

- Storefront stays on:
  `http://localhost:5173`
- Admin dev target is intended to be:
  `http://localhost:5174`
- Backend stays on:
  `http://localhost:5215`

## Pending Work For Next Agent

1. Verify `npm run dev:admin` from an interactive terminal and fix why hidden `Start-Process` did not leave `5174` listening.
2. Open `http://localhost:5173/?auth=login` and visually verify the modal overlays the current storefront page.
3. Open `http://localhost:5174/admin-login` and verify admin login page renders.
4. Confirm admin login works with seeded admin credentials.
5. Decide production deployment strategy:
   - same SPA on two domains with host-based routing, or
   - separate admin frontend deployment.
6. Add real SMS provider integration. Current OTP is only logged for local development.
7. Re-run full verification after any follow-up edits:
   - `dotnet build Ecommerce.sln`
   - `dotnet test Ecommerce.sln --no-build`
   - `npm run build:check`
   - `npm test -- UserRoute.test.tsx`

## Notes For Next Agent

- Do not remove the existing backend `/Auth/login` endpoint. It is still needed for admin email/password login.
- Customer users should not see the admin login UI.
- Customer `/login` and `/register` routes are now compatibility redirects only.
- The modal is triggered by query params, not route navigation:
  `?auth=login&redirectTo=/checkout`
- Browser cannot automatically expose the signed-in Google account email to the app. The implementation uses normal browser email autofill and optional Credential Management API behavior where the browser permits it.
