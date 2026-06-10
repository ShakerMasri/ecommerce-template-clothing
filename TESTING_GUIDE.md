# Testing Guide - Ecommerce Template

Your project uses **Vitest** + **React Testing Library** for unit/component tests and **Playwright** for E2E browser tests.

## Quick Start

```bash
# Run unit tests once
npm run test:run

# Watch unit tests
npm test

# Generate unit test coverage report
npm run test:coverage

# Run Playwright E2E tests
npm run test:e2e
```

---

## Playwright E2E Testing

Playwright E2E tests live in:

```txt
tests/e2e/
```

Run all E2E tests:

```bash
npm run test:e2e
```

Run with a visible browser:

```bash
npm run test:e2e:headed
```

Open Playwright UI mode:

```bash
npm run test:e2e:ui
```

Open the latest HTML report:

```bash
npm run test:e2e:report
```

### Required Local E2E Env File

Create this local-only file:

```txt
.env.e2e.local
```

Required values:

```env
E2E_BASE_URL="http://localhost:3000"

E2E_CUSTOMER_EMAIL="test-customer@example.com"
E2E_CUSTOMER_PASSWORD="local-test-password"

E2E_ADMIN_EMAIL="test-admin@example.com"
E2E_ADMIN_PASSWORD="local-test-password"

E2E_PRODUCT_PATH="/products/example-product"
E2E_ORDER_PRODUCT_PATH="/products/example-product-with-stock"
```

Do not commit `.env.e2e.local`.

### E2E Safety Rules

- Run E2E tests only against staging or localhost.
- Do not run E2E tests against production.
- Do not commit Playwright auth state.
- Do not commit Playwright screenshots, videos, traces, or reports.
- Keep workers low to avoid abusing free staging services.
- Avoid image upload tests unless Cloudinary usage and cleanup are controlled.
- Avoid email inbox automation while `EMAIL_DELIVERY_MODE="log"`.
- Use dedicated test customer/admin accounts.
- Use products with enough stock for order tests.

### Playwright Auth State

The E2E suite saves logged-in customer/admin sessions under:

```txt
tests/e2e/.auth/
```

If login state becomes stale, delete that folder and rerun:

```bash
rm -rf tests/e2e/.auth
npm run test:e2e
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force tests/e2e/.auth
npm run test:e2e
```

### Current E2E Coverage

Current Playwright coverage includes:

- public homepage/products smoke tests
- customer login
- customer cart add/cleanup
- customer authenticated pages
- controlled customer order creation
- guest auth guard behavior
- admin read-only pages
- admin orders read-only API/page behavior

---

## Unit and Component Test Patterns

### 1. React Component Tests

Test components in:

```txt
src/components/**/*.test.tsx
```

Example:

```typescript
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renders email and password inputs", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));
  });
});
```

### 2. Utility Function Tests

Test functions in:

```txt
src/lib/**/*.test.ts
```

Example:

```typescript
import { describe, expect, it } from "vitest";
import { validateEmail, validatePassword } from "./validations";

describe("Email Validation", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.name+tag@domain.co.uk")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
  });
});

describe("Password Validation", () => {
  it("requires minimum 8 characters", () => {
    expect(validatePassword("short")).toBe(false);
    expect(validatePassword("longpassword123")).toBe(true);
  });
});
```

### 3. API Route Tests

Test routes in:

```txt
src/app/api/**/*.test.ts
```

Use mocks and safe test data. Unit/API tests should not touch production or staging data directly.

Example:

```typescript
import { describe, expect, it } from "vitest";
import request from "supertest";

describe("GET /api/products", () => {
  it("returns list of products", async () => {
    const response = await request(app).get("/api/products").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("name");
    expect(response.body[0]).toHaveProperty("price");
  });

  it("returns 400 for invalid pagination", async () => {
    await request(app).get("/api/products?skip=-1").expect(400);
  });
});
```

### 4. Mocking Patterns

Mock external modules when unit testing code that depends on auth, database access, email, Cloudinary, Redis, or other external services.

Example:

```typescript
import { vi } from "vitest";

vi.mock("~/lib/auth", () => ({
  getSession: vi.fn(() => Promise.resolve({ user: { id: "1" } })),
}));
```

### 5. User Interaction Tests

Example:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("AddToCartControls", () => {
  it("increments quantity on button click", async () => {
    const user = userEvent.setup();

    render(<AddToCartControls productId="1" />);

    const increment = screen.getByRole("button", { name: /\+/ });
    await user.click(increment);

    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });
});
```

---

## What to Test

### Always Test

- Input validation: emails, numbers, dates, ids, slugs.
- Error states and edge cases.
- User interactions: clicks, form submissions, cart changes.
- Critical business logic.
- API responses and error handling.
- Authorization boundaries.
- Customer data scoping.
- Admin-only behavior.
- CSRF or same-origin protection for protected mutations.

### Do Not Over-Test

- Implementation details.
- Third-party library internals.
- Trivial getters/setters.
- Pure styling without behavior.
- External provider behavior that should be mocked in unit tests.

---

## File Organization

```txt
src/
├── components/
│   ├── LoginForm.tsx
│   └── LoginForm.test.tsx
├── lib/
│   ├── validations.ts
│   └── validations.test.ts
├── app/api/
│   ├── products/
│   │   ├── route.ts
│   │   └── products.test.ts

tests/
└── e2e/
    ├── smoke.e2e.ts
    ├── customer-login.e2e.ts
    ├── customer-cart.e2e.ts
    ├── customer-order.e2e.ts
    ├── customer-pages.e2e.ts
    ├── admin-access.e2e.ts
    ├── admin-orders-readonly.e2e.ts
    ├── auth-guards.e2e.ts
    ├── setup/
    └── helpers/
```

---

## Coverage Report

After running:

```bash
npm run test:coverage
```

Open:

```txt
coverage/index.html
```

Target: 70%+ coverage for critical paths.

Coverage should focus on useful tests, not only hitting a number.

---

## Common Assertions

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(screen.getByText("Hello")).toBeInTheDocument();
expect(input).toHaveValue("test@example.com");
expect(input).toHaveAttribute("type", "email");
expect(array).toHaveLength(5);
expect(value).toBeGreaterThan(10);
expect(obj).toHaveProperty("id");
```

---

## Useful Commands

Run a specific unit test file:

```bash
npm run test:run src/lib/validations.test.ts
```

Run all unit tests once:

```bash
npm run test:run
```

Run unit tests in watch mode:

```bash
npm test
```

Generate unit coverage:

```bash
npm run test:coverage
```

Run all E2E tests:

```bash
npm run test:e2e
```

Run E2E tests with browser visible:

```bash
npm run test:e2e:headed
```

Open Playwright UI mode:

```bash
npm run test:e2e:ui
```

Open Playwright report:

```bash
npm run test:e2e:report
```

---

## Recommended Pre-Merge Checks

Before merging a testing or production-hardening branch:

```bash
npm run check
npm run test:run
npm run test:e2e
```

Before production deployment, also run:

```bash
npm run build
```

---

## Testing Safety Rules

- Do not run E2E tests against production.
- Do not run heavy load tests against free staging services.
- Do not commit secrets, auth state, screenshots, videos, traces, or reports.
- Do not use personal customer/admin accounts for E2E tests.
- Do not automate real inbox checks while email delivery is intentionally set to log mode.
- Do not add image upload E2E tests unless Cloudinary usage and cleanup are controlled.
- Keep staging test data disposable and clearly understood as non-production data.

---

## Next Steps

1. Keep Playwright E2E tests staging-safe.
2. Keep generated reports and auth state ignored.
3. Add new E2E coverage only for high-value flows.
4. Review load-testing tooling and licensing before adding k6 or alternatives.
5. Run `npm run check`, `npm run test:run`, and `npm run test:e2e` before merging test branches.
