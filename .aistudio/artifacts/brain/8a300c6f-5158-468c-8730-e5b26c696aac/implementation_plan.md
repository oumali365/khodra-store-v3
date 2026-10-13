# Implementation Plan - Khodra Store V3 Enhancements

## User Requirements & Clarifications Summary
1. **Admin Session & Inactivity**:
   - Separate navigation between external and internal admin tools from explicit logout.
   - 30 minutes of real activity inactivity timeout with warning before expiration and auto-logout on actual timeout.
   - Prevent unmounting / route changes from prematurely terminating the session.
2. **Order Preparation Form Reordering**:
   - Reorder order modal/bordereau sections:
     1. معلومات الطلب (Order Info)
     2. الاتصال (Contact)
     3. المنتجات (Products)
     4. بيانات السائق (Driver Data)
     5. استدعاء السائق (Driver Dispatch / Call)
     6. حالة الطلب (Order Status)
     7. أزرار التحكم (Control Buttons)
3. **Automatic Delivery Fee Fetching**:
   - Internal drivers: fetch fee from existing driver records/rates.
   - External drivers / delivery apps: fetch approved fee from delivery routes/apps.
   - Ensure dynamic fee updates on driver/route change, avoiding stale/async values or zeroing.
4. **Button Label & Dispatch Messaging**:
   - Rename "استدعاء inDrive" to "استدعاء سائق خارجي".
   - Improve dispatch messages to include Order ID, Driver Name/Source, Route/App, Fee, and Dispatch Status with duplicate prevention.
5. **State Persistence**:
   - Ensure order status transitions (Review -> Preparation) persist correctly on page refresh.

---

## Proposed Changes

### 1. Admin Session & Inactivity Timeout (`src/features/layout/AdminPageLayout.tsx` & `src/App.tsx` / hooks)
- Update admin session check and activity tracking to enforce a 30-minute inactivity timer that resets on user clicks, keystrokes, and scroll events.
- Show a warning notification 2 minutes before expiration allowing session extension.
- Ensure navigating between external dashboard and internal tool routes does not destroy the session or trigger timeout.
- Explicit logout button clears session and returns to normal store mode.

### 2. Order Preparation Modal Reordering (`src/features/admin-orders/OrderBordereauModal.tsx` or related modal files)
- Inspect `OrderBordereauModal.tsx` and reorder the layout sections precisely:
  - Header & Order Info (`معلومات الطلب`)
  - Contact details (`الاتصال`)
  - Products list & weight adjustment (`المنتجات`)
  - Driver data & assignment (`بيانات السائق`)
  - Driver dispatch / call section with renamed button (`استدعاء السائق`)
  - Order status dropdown / state (`حالة الطلب`)
  - Control action buttons (Save, Print, Close, Delete) (`أزرار التحكم`)

### 3. Delivery Fee Auto-Fetching & Button Renaming (`src/features/admin-orders/OrderBordereauModal.tsx` & delivery services)
- Ensure selecting an internal driver automatically fetches their configured rate.
- Ensure selecting an external driver / courier / app fetches the associated route fare.
- Rename any occurrence of "استدعاء inDrive" or similar specific branding to "استدعاء سائق خارجي" (`استدعاء سائق خارجي`).
- Construct detailed, structured dispatch notifications with Order #, Driver name/source, Route, Fee, and success/failure status, preventing rapid double-clicks.

### 4. Verification
- Compile and test the app using `compile_applet` and `lint_applet`.
- Verify TypeScript types and clean builds.
