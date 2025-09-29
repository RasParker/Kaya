# Grocery Market App – Specification

## Overview
The Grocery Market App is an online marketplace that connects **buyers, sellers, kayayo (market assistants), and riders**.  
It allows buyers to shop for groceries, sellers to list products, kayayo to help with market pickups, and riders to deliver items in Ghanaian markets, starting with a Makola pilot.  

The goal is to create a lightweight but scalable platform where each role has its own workflow.

---

## User Roles & Flows

### 1. Buyer
- Register / log in.
- Browse products by category.
- Search for specific items.
- Add items to cart and checkout.
- Select delivery method (direct rider delivery, or via kayayo pickup).
- Make payment (mobile money, card, or cash on delivery).
- Track order status.

### 2. Seller
- Register / log in.
- Create and manage product listings (title, price, stock quantity, image).
- View incoming orders.
- Accept or reject orders.
- Update product availability.
- Track completed sales.

### 3. Kayayo (Market Assistant)
- Register / log in.
- View assigned pickup tasks.
- Confirm when an item is picked from the local market.
- Hand over to rider for delivery.
- Mark pickup as completed.

### 4. Rider
- Register / log in.
- View delivery requests.
- Accept or reject delivery tasks.
- Track delivery location and status.
- Mark delivery as completed.
- Notify buyer when order is delivered.

---

## Core Features
- Authentication & user roles (buyer, seller, kayayo, rider).
- Product catalog with search and categories.
- Shopping cart & checkout flow.
- Order management system (order creation, status updates).
- Delivery assignment system (linking kayayo & rider).
- Real-time notifications (order accepted, picked up, en route, delivered).
- Basic admin dashboard (optional for MVP).

---

## Technical Notes
- **Frontend**: Should be browser-based, responsive (mobile-first).
- **Backend**: Agent can choose best stack (Node.js, Python, etc.).
- **Database**: PostgreSQL preferred (Supabase if possible).
- **Authentication**: JWT-based or built-in framework auth.
- **Deployment**: Hosted on Replit initially.
- **Integrations**: Placeholder hooks for payments (mobile money, card).

---

## MVP Scope
For the first version:
- Buyers can browse, add to cart, checkout, and place orders.
- Sellers can list products and manage orders.
- Kayayo and riders can accept tasks and update status.
- No advanced admin tools yet (keep it simple).

---

## Stretch Features (Future)
- Ratings & reviews for sellers, kayayo, and riders.
- Multi-language support.
- Real payment gateway integration.
- GPS tracking for riders.
- Analytics dashboard for sellers and admin.
