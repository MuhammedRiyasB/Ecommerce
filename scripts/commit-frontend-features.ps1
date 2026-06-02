# Commits Frontend in stacked feature branches (each PR shows one feature layer).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backup = Join-Path $PSScriptRoot "_frontend-full"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item "Frontend/src/App.tsx" "$backup/App.tsx" -Force
Copy-Item "Frontend/src/app/store.ts" "$backup/store.ts" -Force
Copy-Item "Frontend/src/layouts/MainLayout.tsx" "$backup/MainLayout.tsx" -Force

@'
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
'@ | Set-Content "Frontend/src/app/store.ts" -Encoding utf8

@'
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<p className="p-8 text-lg font-semibold">Urbaniq storefront</p>} />
      </Route>
    </Routes>
  );
}

export default App;
'@ | Set-Content "Frontend/src/App.tsx" -Encoding utf8

@'
import { Outlet, Link } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Urbaniq
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
'@ | Set-Content "Frontend/src/layouts/MainLayout.tsx" -Encoding utf8

function Restore-FullGlue {
    Copy-Item "$backup/App.tsx" "Frontend/src/App.tsx" -Force
    Copy-Item "$backup/store.ts" "Frontend/src/app/store.ts" -Force
    Copy-Item "$backup/MainLayout.tsx" "Frontend/src/layouts/MainLayout.tsx" -Force
}

function Commit-Branch {
    param(
        [string]$Branch,
        [string]$Base,
        [string]$Message,
        [string[]]$Paths,
        [switch]$RestoreGlue
    )
    git switch -q $Base
    if ($LASTEXITCODE -ne 0) { throw "Base branch $Base not found" }
    git switch -q -C $Branch
    if ($RestoreGlue) { Restore-FullGlue }
    if ($Paths.Count -gt 0) { git add @Paths }
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No changes for $Branch"
        return
    }
    git commit -m $Message
    git push -u origin $Branch --force
    Write-Host "Pushed $Branch"
}

git switch -q main
git pull origin main

Commit-Branch -Branch "feature/frontend-scaffold" -Base "main" -Message "feat(frontend): add React app scaffold and shared tooling" -Paths @(
    ".gitignore",
    "Frontend/package.json",
    "Frontend/package-lock.json",
    "Frontend/vite.config.ts",
    "Frontend/tsconfig.json",
    "Frontend/tsconfig.app.json",
    "Frontend/tsconfig.node.json",
    "Frontend/eslint.config.js",
    "Frontend/index.html",
    "Frontend/README.md",
    "Frontend/.gitignore",
    "Frontend/public",
    "Frontend/src/main.tsx",
    "Frontend/src/index.css",
    "Frontend/src/App.css",
    "Frontend/src/app",
    "Frontend/src/layouts",
    "Frontend/src/App.tsx"
)

Commit-Branch -Branch "feature/catalog" -Base "feature/frontend-scaffold" -RestoreGlue -Message "feat(frontend): add catalog browsing and product pages" -Paths @(
    "Frontend/src/features/catalog",
    "Frontend/src/assets",
    "Frontend/src/App.tsx",
    "Frontend/src/layouts/MainLayout.tsx"
)

Commit-Branch -Branch "feature/auth" -Base "feature/catalog" -RestoreGlue -Message "feat(frontend): add authentication and account pages" -Paths @(
    "Frontend/src/features/auth",
    "Frontend/src/features/account",
    "Frontend/src/app/store.ts",
    "Frontend/src/App.tsx",
    "Frontend/src/layouts/MainLayout.tsx"
)

Commit-Branch -Branch "feature/cart" -Base "feature/auth" -RestoreGlue -Message "feat(frontend): add shopping cart" -Paths @(
    "Frontend/src/features/cart",
    "Frontend/src/app/store.ts",
    "Frontend/src/App.tsx",
    "Frontend/src/layouts/MainLayout.tsx"
)

Commit-Branch -Branch "feature/wishlist" -Base "feature/cart" -RestoreGlue -Message "feat(frontend): add wishlist with sync and heart toggle" -Paths @(
    "Frontend/src/features/wishlist",
    "Frontend/src/App.tsx",
    "Frontend/src/features/catalog/components/ProductCard.tsx",
    "Frontend/src/features/catalog/ProductDetailPage.tsx"
)

Commit-Branch -Branch "feature/address" -Base "feature/wishlist" -Message "feat(frontend): add checkout address step" -Paths @(
    "Frontend/src/features/checkout/addressApiSlice.ts",
    "Frontend/src/features/checkout/components/AddressForm.tsx"
)

Commit-Branch -Branch "feature/payment" -Base "feature/address" -Message "feat(frontend): add Stripe payment step and card validation" -Paths @(
    "Frontend/src/features/checkout/paymentApiSlice.ts",
    "Frontend/src/features/checkout/components/PaymentForm.tsx",
    "Frontend/src/features/checkout/components/OrderSuccessScreen.tsx"
)

Commit-Branch -Branch "feature/orders" -Base "feature/payment" -RestoreGlue -Message "feat(frontend): add orders list and checkout flow" -Paths @(
    "Frontend/src/features/orders",
    "Frontend/src/features/checkout/CheckoutPage.tsx",
    "Frontend/src/features/checkout/components/OrderSummary.tsx",
    "Frontend/src/App.tsx"
)

Commit-Branch -Branch "feature/admin" -Base "feature/orders" -RestoreGlue -Message "feat(frontend): add admin dashboard and management pages" -Paths @(
    "Frontend/src/features/admin",
    "Frontend/src/App.tsx"
)

Restore-FullGlue
git switch -q main
Write-Host "Done."
