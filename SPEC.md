# Grocery Market App – Specification

## Overview
The Grocery Market App is an online marketplace that connects **buyers, sellers, kayayo (market assistants), riders, and an admin**.  
It allows buyers to shop for groceries, sellers to list products, kayayo to help with market pickups, riders to deliver items, and an admin to oversee and manage the platform.  

The goal is to create a lightweight but scalable platform where each role has its own workflow.

---

## User Roles & Flows

### 1. Buyer
- Register / log in.
- Browse products by category or search.
- Add items to cart and checkout.
- Select delivery method (direct rider or via kayayo).
- Make payment (MoMo, card, or cash).
- Track order status.
- Confirm delivery, give ratings, view order history.

### 2. Seller
- Register / log in.
- List and manage products (name, price, stock, image).
- View and accept/reject incoming orders.
- Update availability and pricing.
- Track completed sales.
- View earnings and request withdrawals.

### 3. Kayayo (Market Assistant)
- Register / log in.
- View assigned pickup tasks.
- Confirm items picked up from sellers.
- Hand over to rider.
- Mark pickup as completed.
- View earnings and request withdrawals.

### 4. Rider
- Register / log in.
- View available delivery requests.
- Accept delivery tasks.
- Confirm pickup from Kayayo.
- Track delivery and update status.
- Confirm delivery completed.
- View earnings and request withdrawals.

### 5. Admin
- Register / log in (secure credentials).
- Manage platform operations.

#### Core Admin Features (MVP)
1. **User Management**
   - Approve, suspend, or remove sellers, kayayei, riders, and buyers.
   - Verify IDs / basic KYC for kayayei and riders.  

2. **Order Monitoring**
   - View all active orders in real time.
   - Track delays (e.g., Kayayo stuck, Rider late).
   - Manually reassign orders if needed.  

3. **Payments & Escrow**
   - Dashboard showing amounts held, released, pending.
   - Ability to freeze suspicious payments.
   - Export weekly and monthly reports.  

4. **Dispute Resolution**
   - Handle flagged issues (e.g., missing items, late delivery).
   - Review photos, logs, GPS timestamps.
   - Decide refunds, partial releases, or penalties.  

5. **Marketplace Setup**
   - Add new markets (e.g., Makola, Kaneshie).
   - Approve categories for sellers (fish, yam, tomatoes, etc.).  

6. **Ratings & Trust**
   - Monitor consistently low-rated sellers, kayayei, or riders.
   - Remove fake/bot accounts spamming reviews.  

7. **Analytics**
   - Track active users by role.
   - Measure average delivery times.
   - View top-selling items and busiest markets.  

---

## Core Features
- Authentication & role-based dashboards.
- Product catalog with search and categories.
- Cart & checkout flow.
- Order management with status updates.
- Delivery assignment system.
- Notifications for all user roles.
- Escrow-based payment system.
- Admin oversight and controls.

---

## Technical Notes
- **Frontend**: Browser-based, responsive (mobile-first).
- **Backend**: Agent can choose best stack (Node.js, Python, etc.).
- **Database**: PostgreSQL preferred (Supabase if possible).
- **Authentication**: JWT or framework auth.
- **Deployment**: Hosted on Replit initially.
- **Integrations**: Payment hooks (MoMo, card).

---

## MVP Scope
- Buyers: Browse, checkout, place orders.
- Sellers: Manage products and accept/reject orders.
- Kayayo: Pickup and handover to rider.
- Riders: Delivery and confirmation.
- Admin: Manage users, monitor orders, disputes, and payments.

---

## Stretch Features (Future)
- Ratings & reviews (detailed).
- Multi-language support.
- GPS rider tracking.
- Real payment integrations.
- Advanced analytics dashboards.
