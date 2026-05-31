# Quote Builder — Full Technical Context

## 1) Executive Summary

`quote-builder` is a **Next.js App Router** application for service professionals to:
- Build quotes from a structured services catalog.
- Manage basket items (including extras and manual overrides).
- Export quotes to PDF and share them.
- Manage profile/business details and quote settings.
- View history and drafts.
- Support admin operations (user list, stats, impersonation).

The architecture is **client-first state management** with **server API routes** for auth/admin/sync, and **Supabase (service-role)** as the persistence backend.

There is **no Stripe runtime integration** and **no Clerk integration** in the current codebase.

---

## 2) High-Level Architecture

### 2.1 Runtime Model

- **Client layer**: React client components + context providers hold most business state.
- **Server layer**: `app/api/**/route.ts` for auth/admin/sync/upload/health.
- **Persistence**:
  - Browser: `localStorage` + `IndexedDB` (basket/drafts).
  - Server: Supabase tables (`JSONB` payloads per user).
- **Session/Auth**: Custom JWT cookie (`quoteBuilder_session`) using `jose`.

### 2.2 Main App Boundaries

- **Public UX routes**: catalog browsing, service wizard, cart, profile.
- **Authenticated routes/components**: profile actions, sync APIs, quote history.
- **Admin area**: `/admin`, `/admin/user/[userId]`, admin APIs with `X-Admin-Key`.
- **Cross-cutting concerns**:
  - Language/i18n context.
  - Rate limiting.
  - Profile logo upload to Supabase storage.

---

## 3) Project Structure (Core)

```text
app/
  admin/
    page.tsx
    user/[userId]/page.tsx
  api/
    admin/
      login/route.ts
      users/route.ts
      user/[userId]/route.ts
      stats/route.ts
      impersonate/route.ts
    auth/
      login/route.ts
      signup/route.ts
      signup-with-email/route.ts
      me/route.ts
      logout/route.ts
      stop-impersonate/route.ts
      change-password/route.ts
      send-code/route.ts
      check-code/route.ts
      verify-code/route.ts
      reset-password/route.ts
      send-username/route.ts
      lib/
        users-store.ts
        verification-codes-store.ts
        send-email.ts
    sync/
      profile/route.ts
      basket/route.ts
      history/route.ts
      settings/route.ts
      price-overrides/route.ts
    upload/profile-logo/route.ts
    health/route.ts
  category/[slug]/page.tsx
  category/[slug]/[serviceId]/page.tsx
  cart/page.tsx
  profile/page.tsx
  contexts/
    AuthContext.tsx
    QuoteBasketContext.tsx
    QuoteHistoryContext.tsx
    ProfileContext.tsx
    SettingsContext.tsx
    PriceOverridesContext.tsx
    LanguageContext.tsx
  components/
    AppHeader.tsx
    Cart.tsx
    RequireAuth.tsx
    utils/pdfExport.ts
  locales/
    he.json
    en.json
    ar.json
    ru.json
lib/
  auth-server.ts
  supabase-server.ts
  rate-limit.ts
  api-helpers.ts
  sync.ts
  basket-storage.ts
  drafts-storage.ts
  admin-config.ts
  post-login-redirect.ts
supabase-schema.sql
supabase-storage-profile-logos.sql
```

---

## 4) Data Model (Supabase / DB)

`supabase-schema.sql` defines these main tables:

- `app_users`  
  `id`, `username` (unique), `email` (unique), `password_hash`, `created_at`.

- `verification_codes`  
  `(email, code)` PK, `expires_at`, `used`, `created_at`.

- `quote_basket`  
  `user_id` PK, `items JSONB`, `updated_at`.

- `quote_history`  
  `user_id` PK, `quotes JSONB`, `updated_at`.

- `user_profile`  
  `user_id` PK, `profile JSONB`, `updated_at`.

- `user_settings`  
  `user_id` PK, `settings JSONB`, `updated_at`.

- `price_overrides`  
  `user_id` PK, `overrides JSONB`, `updated_at`.

RLS is enabled on all tables; server uses `SUPABASE_SERVICE_ROLE_KEY` (service-role access via API routes).

### Storage
- Supabase storage bucket `profile-logos` (public read policy) from `supabase-storage-profile-logos.sql`.

---

## 5) Context & State Architecture

### 5.1 AuthContext
- Bootstraps from `GET /api/auth/me`.
- Handles login/signup/logout/password changes.
- Exposes impersonation state and stop-impersonation flow.

### 5.2 QuoteBasketContext
- Source of truth for current basket items.
- Persists in IndexedDB (`quoteBasket_<user|guest>`).
- Syncs to `/api/sync/basket` for logged users.
- Computes quote totals (before VAT / VAT / final total).

### 5.3 QuoteHistoryContext
- Stores saved quote snapshots (`SavedQuote[]`).
- Persists to localStorage + `/api/sync/history`.
- Supports status transitions (`draft`, `sent`, `approved`, `paid`).

### 5.4 SettingsContext
- Manages:
  - `defaultQuoteTitle`
  - `nextQuoteNumber`
  - `validityDays`
  - `vatRate`
- Local-first + server-sync (`/api/sync/settings`).

### 5.5 ProfileContext
- Business profile details + logo.
- Local-first merge logic + `/api/sync/profile`.

### 5.6 PriceOverridesContext
- Per-service base price override map.
- Local-first + `/api/sync/price-overrides`.

### 5.7 LanguageContext
- Locale state and direction (`rtl`/`ltr`), persisted in localStorage.

---

## 6) Main API / Server Flow Map

## 6.1 Authentication & Session

- `POST /api/auth/login`: validate credentials, issue JWT cookie.
- `POST /api/auth/signup`: create user + set session cookie.
- `POST /api/auth/signup-with-email`: verify code, create user, set cookie.
- `GET /api/auth/me`: read cookie, verify JWT, return user + impersonation marker.
- `POST /api/auth/logout`: clear session and impersonation cookies.
- `POST /api/auth/stop-impersonate`: restore prior session cookie.
- Recovery/verification:
  - `send-code`, `check-code`, `verify-code`, `reset-password`, `send-username`.

## 6.2 Admin

- `POST /api/admin/login`: validate admin credentials, return admin key.
- `GET /api/admin/users`: list users.
- `GET|DELETE /api/admin/user/[userId]`: user detail/delete.
- `GET /api/admin/stats`: aggregates users + quote history + basket metrics.
- `POST /api/admin/impersonate`: switch session to target user with backup cookie.

## 6.3 Sync APIs

JWT-protected endpoints:
- `GET|POST /api/sync/profile`
- `GET|POST /api/sync/basket`
- `GET|POST /api/sync/history`
- `GET|POST /api/sync/settings`
- `GET|POST /api/sync/price-overrides`

Pattern:
- Client loads local first.
- If authenticated, pulls server snapshot.
- Writes local immediately on changes.
- Posts updates asynchronously to server.

## 6.4 Upload + Health

- `POST /api/upload/profile-logo`: upload image data URL -> Supabase storage URL.
- `GET /api/health`: service/Supabase config status.

---

## 7) Critical Business Logic (Extracted Code)

Below are the **core logic blocks** that drive pricing, quote totals, financial outputs, and document generation.

### 7.1 Service Wizard Pricing Engine (`app/category/[slug]/[serviceId]/page.tsx`)

```ts
const effectiveBasePrice = service ? getBasePrice(service.id, service.basePrice) : 0;
const baseTotal = useMemo(() => {
  if (!service) return 0;
  const qty = service.isCounter ? qtyNum : 1;
  return effectiveBasePrice * qty;
}, [service, qtyNum, effectiveBasePrice]);

const qty = service ? (service.isCounter ? qtyNum : 1) : 1;

const selectedExtrasList = useMemo(() => {
  if (!service) return [];
  return service.questions
    .filter((q) => answers[q.id] === true)
    .map((q) => {
      const hasQtyLabel = 'quantityLabel' in q.impact && q.impact.quantityLabel;
      const useQtyForFixed = q.impact.type === 'fixed' && hasQtyLabel && qty > 1;
      let price: number;
      if (q.impact.type === 'percent') {
        price = (baseTotal * q.impact.value) / 100;
      } else if (q.impact.type === 'fixedPerUnit') {
        price = q.impact.value * qty;
      } else if (q.impact.type === 'fixedWithQuantity') {
        const qtyQ = Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1);
        price = q.impact.value * qtyQ;
      } else if (useQtyForFixed) {
        const qtyQ = Math.min(qty, Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1));
        price = q.impact.value * qtyQ;
      } else {
        price = q.impact.value;
      }
      const qtyQ = q.impact.type === 'fixedWithQuantity'
        ? Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1)
        : useQtyForFixed
          ? Math.min(qty, Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1))
          : null;
      const label = hasQtyLabel ? q.impact.quantityLabel! : "יח'";
      const qText = t(`question.${service.id}.${q.id}`, q.text);
      const text = qtyQ != null && qtyQ > 0
        ? `${qText} (${qtyQ} ${label})`
        : qText;
      return { text, price };
    });
}, [service, answers, baseTotal, qty, questionQuantities, t]);

const extrasTotal = useMemo(() => {
  return selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
}, [selectedExtrasList]);

const total = baseTotal + extrasTotal;
```

### 7.2 Basket Totals + VAT (`app/contexts/QuoteBasketContext.tsx`)

```ts
const totalBeforeVAT = items.reduce((sum, item) => {
  if (item.overridePrice !== undefined) return sum + item.overridePrice;
  const extrasTotal = item.extras?.reduce((s, e) => s + (e.price || 0), 0) || 0;
  return sum + (item.basePrice || 0) + extrasTotal;
}, 0);

const VAT = totalBeforeVAT * vatRate;
const totalWithVAT = totalBeforeVAT + VAT;
```

### 7.3 Override Price Handling (`app/components/Cart.tsx`)

```ts
const calculated = item
  ? item.basePrice + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)
  : 0;
const trimmed = editPrice.trim();
if (trimmed === '' || parseFloat(trimmed) === 0 || isNaN(parseFloat(trimmed))) {
  clearItemPriceOverride(id);
  setEditingId(null);
  setEditPrice('');
  return;
}
const newPrice = parseFloat(trimmed);
if (newPrice < 0) {
  setEditingId(null);
  setEditPrice('');
  return;
}
if (newPrice === calculated) {
  clearItemPriceOverride(id);
} else {
  updateItemPrice(id, newPrice);
}
```

### 7.4 Quote Snapshot + Number Increment on Export (`app/components/Cart.tsx`)

```ts
const handleExportPDF = async () => {
  if (!user) {
    router.push('/login?from=' + encodeURIComponent('/cart'));
    return;
  }
  const { customerPhone, customerEmail, customerAddress, customerCompanyId } = getCustomerContact();
  setIsDownloading(true);
  try {
    addQuote({
      items,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      customerName: customerName.trim() || undefined,
      customerPhone,
      customerEmail,
      customerAddress,
      customerCompanyId,
      notes: notes.trim() || undefined,
      quoteNumber: nextQuoteNumber,
      status: 'download',
      quoteStatus: 'draft',
    });
    const blob = await generateQuotePDFAsBlob(
      items,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      profile,
      customerName.trim() || undefined,
      notes.trim() || undefined,
      defaultQuoteTitle,
      nextQuoteNumber,
      customerPhone,
      customerEmail,
      customerAddress,
      customerCompanyId,
      validityDays ?? undefined,
      vatRate
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hatzaat-mechir-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setNextQuoteNumber(nextQuoteNumber + 1);
    clearBasket();
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerCompanyId('');
    setNotes('');
  } finally {
    setIsDownloading(false);
  }
};
```

### 7.5 PDF Data Composition (`app/components/utils/pdfExport.ts`)

```ts
function buildQuoteContent(params: {
  items: BasketItem[];
  totalBeforeVAT: number;
  totalWithVAT: number;
  profile?: QuoteProfile | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerCompanyId?: string | null;
  notes?: string | null;
  quoteTitle?: string | null;
  quoteNumber?: number | null;
  validityDays?: number | null;
  vatRate?: number;
}) {
  const { items, totalBeforeVAT, totalWithVAT, profile, customerName, customerPhone, customerEmail, customerAddress, customerCompanyId, notes, quoteTitle, quoteNumber, validityDays, vatRate: rateParam } = params;
  const vatRate = rateParam ?? 0.18;
  const today = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const customerNameVal = customerName?.trim() ?? '—';
  const customerLines: string[] = [];
  if (customerCompanyId?.trim()) customerLines.push(`<span class="client-company-id">ח.פ ${escapeHtml(customerCompanyId.trim())}</span>`);
  if (customerPhone?.trim()) customerLines.push(`<span class="client-phone">${escapeHtml(customerPhone.trim())}</span>`);
  if (customerEmail?.trim()) customerLines.push(`<span class="client-email">${escapeHtml(customerEmail.trim())}</span>`);
  if (customerAddress?.trim()) customerLines.push(`<span class="client-address">${escapeHtml(customerAddress.trim())}</span>`);
  const clientDetails = customerLines.length > 0 ? customerLines.join(' &nbsp; ') : '—';
  const forBlock = `<div class="for-block"><span class="for-label">עבור:</span> <strong>${escapeHtml(customerNameVal)}</strong><br><span class="for-details">${clientDetails}</span></div>`;

  const days = validityDays != null && validityDays >= 1 ? validityDays : 30;
  const validityText = `הצעת מחיר זו תקפה ל-${days} יום מיום הנפקתה`;
  const quoteNumText = quoteNumber != null ? `מס' הצעה: #${quoteNumber}` : '';
  const titleOnly = quoteTitle?.trim() || 'הצעת מחיר לשיפוץ כללי';

  const companyLines: string[] = [];
  if (profile?.businessName) companyLines.push(`<div class="company-name">${escapeHtml(profile.businessName)}</div>`);
  if (profile?.companyId) companyLines.push(`<div class="company-line">ח.פ ${escapeHtml(profile.companyId)}</div>`);
  if (profile?.phone) companyLines.push(`<div class="company-line">${escapeHtml(profile.phone)}</div>`);
  if (profile?.address) companyLines.push(`<div class="company-line">${escapeHtml(profile.address)}</div>`);
  if (profile?.email) companyLines.push(`<div class="company-line">${escapeHtml(profile.email)}</div>`);
  const companyBlock =
    companyLines.length > 0
      ? `<div class="header-company">${companyLines.join('')}</div>`
      : '<div class="header-company"></div>';

  const logoBlock =
    hasProfile(profile) && profile!.logo
      ? `<img src="${profile!.logo}" alt="לוגו" class="header-logo" />`
      : '<div class="header-logo-placeholder">הלוגו שלך</div>';

  const profileBlock = `<div class="header-band"></div>${forBlock}`;
  const notesText = notes?.trim() ?? '';
  const notesItems = notesText ? notesText.split(/\n/).filter((l) => l.trim()) : [];
  const notesListHtml = notesItems.length > 0
    ? `<ul class="notes-list">${notesItems.map((line) => `<li>${escapeHtml(line.trim())}</li>`).join('')}</ul>`
    : '<div class="notes-content">—</div>';
  const notesBlock = `<div class="notes-section"><div class="notes-title">הערות:</div>${notesListHtml}${validityText ? `<p class="notes-validity">${escapeHtml(validityText)}</p>` : ''}</div>`;
  const businessLabel = hasProfile(profile) && profile!.businessName ? escapeHtml(profile!.businessName) : 'חתימת בעל העסק';
  const footerBlock = `<div class="pdf-footer"><div class="footer-sig-block footer-sig-client"><span class="footer-sig-label">${escapeHtml(customerNameVal)}</span><span class="footer-sig-line"></span></div><div class="footer-sig-block footer-sig-business"><span class="footer-sig-label">${businessLabel}</span><span class="footer-sig-line"></span></div></div>`;

  const VAT = totalBeforeVAT * vatRate;
  return {
    profileBlock,
    notesBlock,
    footerBlock,
    validityText,
    today,
    items,
    totalBeforeVAT,
    VAT,
    totalWithVAT,
  };
}
```

### 7.6 Preview HTML Construction (`app/components/utils/pdfExport.ts`)

```ts
export function getQuotePreviewHtml(params: {
  items: BasketItem[];
  totalBeforeVAT: number;
  totalWithVAT: number;
  profile?: QuoteProfile | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerCompanyId?: string | null;
  notes?: string | null;
  quoteTitle?: string | null;
  quoteNumber?: number | null;
  validityDays?: number | null;
  vatRate?: number;
}): string {
  const content = buildQuoteContent(params);
  const { profileBlock, notesBlock, footerBlock, items: contentItems, VAT } = content;
  const { totalBeforeVAT, totalWithVAT } = params;
  const rate = params.vatRate ?? 0.18;
  const vatLabel = rate === 0 ? 'עוסק פטור' : `מע"מ (${Math.round(rate * 100)}%)`;

  const tableRows = contentItems
    .map((item) => {
      const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
      const calculatedPrice = item.basePrice + extrasTotal;
      const currentPrice = item.overridePrice ?? calculatedPrice;
      const qty = item.quantity ?? 1;
      const pricePerUnit = currentPrice / qty;
      const hasExtras = item.extras && item.extras.length > 0;
      const extrasDesc = hasExtras
        ? item.extras!.map((e) => `• ${escapeHtml(formatExtraForQuote(e.text))}`).join('<br>')
        : '';
      const qtyDisplay = qty > 1 && item.unit ? `${qty} ${item.unit}` : String(qty);
      return `
        <tr>
          <td><div class="item-name">${escapeHtml(item.name)}</div>${extrasDesc ? `<div class="item-extras">${extrasDesc}</div>` : ''}</td>
          <td style="text-align:center">${escapeHtml(qtyDisplay)}</td>
          <td class="price-cell">₪${pricePerUnit.toLocaleString('he-IL')}</td>
          <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="quote-pdf-body quote-preview-body" dir="rtl">
      <div class="container">
        ${profileBlock}
        <div class="table-summary-wrap">
          <table class="items-table"><tbody>${tableRows}</tbody></table>
          <div class="summary-below">
            <div class="summary">
              <div class="summary-row subtotal"><span>סה"כ</span><span class="amount">₪${totalBeforeVAT.toLocaleString('he-IL')}</span></div>
              <div class="summary-row vat"><span>${vatLabel}</span><span class="amount">₪${VAT.toLocaleString('he-IL')}</span></div>
              <div class="summary-row total"><span>סה"כ לתשלום</span><span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span></div>
            </div>
          </div>
        </div>
        ${notesBlock}
      </div>
      ${footerBlock}
    </div>
  `;
}
```

### 7.7 Draft Storage Engine (`lib/drafts-storage.ts`)

```ts
export async function saveDraft(
  userId: string | null | undefined,
  draft: Omit<QuoteDraft, 'id' | 'savedAt'>
): Promise<QuoteDraft> {
  const key = getDraftsKey(userId);
  const list = await getDrafts(userId);
  const now = new Date().toISOString();
  const newDraft: QuoteDraft = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    savedAt: now,
  };
  list.unshift(newDraft);
  // הגבלה ל־20 טיוטות
  const trimmed = list.slice(0, 20);
  await basketStorageSet(key, JSON.stringify(trimmed));
  return newDraft;
}
```

---

## 8) Admin Impersonation & Security-Relevant Session Logic

From `lib/auth-server.ts`:

```ts
const COOKIE_NAME = 'quoteBuilder_session';
const SESSION_PREV_COOKIE = 'quoteBuilder_session_prev';
const IMPERSONATION_MARKER_COOKIE = 'quoteBuilder_impersonating';

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, cookieBaseOptions());
}

export function setPrevSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_PREV_COOKIE, token, cookieBaseOptions());
}

export function setImpersonationMarkerCookie(response: NextResponse): void {
  response.cookies.set(IMPERSONATION_MARKER_COOKIE, '1', {
    ...cookieBaseOptions(),
    maxAge: JWT_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export function clearImpersonationCookies(response: NextResponse): void {
  response.cookies.set(SESSION_PREV_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(IMPERSONATION_MARKER_COOKIE, '', { path: '/', maxAge: 0 });
}
```

This powers:
- Admin "login as user" (`/api/admin/impersonate`).
- Recovery back to admin (`/api/auth/stop-impersonate`).
- Header banner + state marker in UI.

---

## 9) Infrastructure Integration Audit

## 9.1 Supabase
- **Implemented and active**.
- Server client:
  - `lib/supabase-server.ts`:
    ```ts
    export const supabaseAdmin = supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
      : null;
    ```
- Used for:
  - User/auth-adjacent records.
  - Sync tables for profile/basket/history/settings/overrides.
  - Logo upload to storage bucket.

## 9.2 Stripe
- **Not implemented in runtime code**.
- No Stripe dependency/routes/webhooks.
- Mentioned in planning docs only.

## 9.3 Clerk
- **Not implemented**.
- No Clerk dependencies or middleware usage.

## 9.4 Vercel
- Deployment assumptions in docs target Vercel env setup.
- No strict platform lock-in (`vercel.json` absent), but ops guidance points to Vercel.

## 9.5 Email
- `nodemailer` used for code and notification email flows.
- Depends on SMTP env vars.

## 9.6 Rate Limiting
- In-memory process map (`lib/rate-limit.ts`).
- Good for single instance; not globally consistent across scaled serverless instances.

---

## 10) Environment Variables & Operational Configuration

Observed env usage:
- `JWT_SECRET`
- `NODE_ENV`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_USER`
- `EMAIL_APP_PASSWORD`
- `ADMIN_USERNAME`
- `ADMIN_SECRET`
- `NOTIFY_ADMIN_EMAIL`
- `NOTIFY_SMS_EMAIL`

---

## 11) End-to-End Functional Flow (Business)

1. User selects category/service.
2. Service wizard computes base + extras (impact engine).
3. Item added to basket.
4. Basket context computes totals with settings VAT.
5. User exports/shares:
   - Quote snapshot saved to history with status + quote number.
   - PDF generated from structured HTML pipeline.
6. Settings increment `nextQuoteNumber`.
7. Basket cleared and user redirected.
8. Profile page supports:
   - Details and logo updates.
   - Saved quotes and drafts.
   - Settings, passwords, base price overrides.

---

## 12) Senior Architect Notes (Current Gaps / Risks)

- Quote number generation is client-side; potential collisions across devices/tabs.
- In-memory rate limiter is non-distributed.
- Default admin secret/username fallback in code should be hardened for production.
- Legacy PDF function has a hardcoded VAT label path (main flow uses dynamic blob path).
- No CI pipeline/tests discovered; quality gates rely on local lint/typecheck.
- Payment stack (Stripe) not yet implemented despite planning docs.

---

## 13) Dependency Snapshot

`package.json` confirms key runtime deps:
- Next.js 16 + React 19
- Supabase JS
- `jose` (JWT)
- `bcryptjs` (password hashing)
- `nodemailer`
- `html2canvas` + `jspdf` (quote PDF rendering)
- `framer-motion`, `lucide-react`

No Stripe/Clerk dependencies are present.

---

## 14) Conclusion

This app is a well-structured, context-driven quote workflow system with custom auth and Supabase-backed sync/storage.  
Its strongest assets are:
- Clear business logic in dedicated contexts/utilities.
- Robust local-first UX with server sync.
- Practical admin observability (stats + impersonation).

Primary next architecture priorities:
1. Server-side quote number sequencing.
2. Distributed rate limiting.
3. CI + test automation.
4. Payment integration if subscriptions are required.

