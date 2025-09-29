# USER_FLOWS.md
Detailed screen-by-screen flows for the Grocery Market App MVP.
This file complements `SPEC.md` by focusing on **UI, UX, and role-specific screens**.

---

## Buyer Flow (MVP)

### 1. Splash & Language / Market Select
- **Elements**: Logo, tagline, language picker (English, Twi, Ga), market selector (default Makola).
- **Actions**: Continue → Phone verification.
- **Microcopy**: “Choose your language — we’ll speak your market.”

### 2. Onboarding / Phone Verification & Payment Link
- **Elements**: Phone input (OTP), MoMo link button, T&Cs checkbox.
- **Actions**: Verify phone, link MoMo.
- **Edge cases**: SMS fallback, Kayayo without smartphone → SMS confirmations.

### 3. Home / Browse Market
- **Elements**: Search bar, categories, seller cards, optional map view.
- **Actions**: Search or tap seller to view items.
- **UX**: Show price, unit, seller on product cards.

### 4. Product / Seller Item Screen
- **Elements**: Product image, unit, price, seller info, quantity selector, note field.
- **Actions**: Add to cart.
- **UX**: Confirm item source with toast.

### 5. Cart (Critical)
- **Elements**: Items grouped by seller, subtotals, fees (platform, kayayo, rider), grand total.
- **Actions**: Modify items, set substitution prefs, confirm address/time, select Kayayo, proceed to payment.
- **Microcopy**: “This order needs items from 3 sellers. A Kayayo will shop them for you.”

### 6. Select Kayayo
- **Elements**: Recommended Kayayo, list of kayayei with rating/fee/time.
- **Actions**: Pick Kayayo or auto-match.
- **UX**: Tooltip for matching logic.

### 7. Order Confirmation
- **Elements**: Order summary, payment status, live status tiles for sellers & Kayayo.
- **Actions**: Cancel order (before acceptance).
- **Edge cases**: Declines trigger substitution/alternatives.

### 8. Kayayo Shopping Live
- **Elements**: Progress bar, checklist per seller, optional photos, map, contact buttons.
- **UX**: Notify buyer as items are picked.

### 9. Handover to Rider
- **Elements**: Rider profile, ETA, map tracking, issue report button.
- **Actions**: Rider starts trip → buyer sees “Out for delivery.”

### 10. Delivery Received
- **Elements**: Delivery checklist, confirm receipt, report problem.
- **Actions**: Confirm → release payments; Report → dispute flow.
- **Edge cases**: Auto-confirm after grace period.

### 11. Ratings & Feedback
- **Elements**: Ratings for sellers, Kayayo, rider; quick tags; comment box.
- **Actions**: Submit rating.

### 12. Order History & Receipts
- **Elements**: Past orders, receipts, dispute button.
- **Actions**: View/download receipt, reorder items.

---

## Seller Flow (MVP)

### 1. Splash / Login
- **Elements**: Phone input (OTP), MoMo/cash payout toggle.
- **Actions**: Verify OTP.
- **Microcopy**: “Sign in with your phone — this helps buyers pay you quickly.”

### 2. Dashboard (Home)
- **Elements**: Balance, today’s earnings, pending orders.
- **Actions**: View orders, add item, withdraw.

### 3. Product Catalog
- **Elements**: List of items, unit, price, availability toggle.
- **Actions**: Add/edit/toggle items.
- **Microcopy**: “Quickly add your core items so Kayayos know where to shop.”

### 4. Quick Price & Availability Panel
- **Elements**: Fast +/- price controls, availability toggles.
- **Actions**: Update prices live.
- **Edge cases**: Price updates require buyer approval if order is pending.

### 5. Incoming Order Notification
- **Elements**: Push/in-app cards with accept/decline.
- **Actions**: Accept reserves items; decline triggers alternative flow.
- **Timer**: Auto-decline if no response.

### 6. Order Details
- **Elements**: Buyer info, item list, payment status.
- **Actions**: Confirm availability, mark prepared, hand over to Kayayo.

### 7. Prepare & Handover
- **Elements**: Checklist, Kayayo QR/ID verification.
- **Actions**: Confirm handover with QR or 4-digit code.
- **Anti-fraud**: Require scan/code.

### 8. Orders History
- **Elements**: Completed orders, receipts, filters.
- **Actions**: View/download invoice.

### 9. Payouts / Withdraw
- **Elements**: Wallet balance, withdraw options, history.
- **Actions**: Request withdrawal via MoMo.

### 10. Ratings, Disputes & Support
- **Elements**: Ratings, dispute list, support contact.
- **Actions**: Respond to disputes, upload evidence.

### 11. Settings & Stall Profile
- **Elements**: Stall name, location, hours, contact.
- **Actions**: Edit info, add stall photo.

---

## Kayayo Flow (MVP)

### 1. Splash / Login
- **Elements**: Phone OTP, language toggle.
- **Actions**: Enter OTP → Availability screen.

### 2. Availability / Start Shift
- **Elements**: Big “Start Shift” toggle, capacity note.
- **Actions**: Go available/unavailable.

### 3. Incoming Order Notification
- **Elements**: New order card with stalls, fee, timer.
- **Actions**: Accept/decline quickly.

### 4. Order Details / Checklist
- **Elements**: Sellers, items, buyer notes, route.
- **Actions**: Start shopping.

### 5. Market Map & Route (Simple)
- **Elements**: Ordered list/map with stalls.
- **Actions**: Navigate stall to stall.

### 6. Seller Handover Verification
- **Elements**: Checklist, QR scan or code entry, photo proof.
- **Actions**: Mark picked only after verification.

### 7. Shopping Progress
- **Elements**: Progress bar, ticked items, missing item report.
- **Actions**: Update status per item.

### 8. Communication
- **Elements**: Call seller, rider, buyer, support.
- **Actions**: Request substitution, contact parties.

### 9. Handover to Rider
- **Elements**: Rider profile, QR/code verification.
- **Actions**: Confirm handover, update earnings.

### 10. Earnings & Wallet
- **Elements**: Balance, pending vs available, withdraw.
- **Actions**: Request withdrawal.

### 11. Ratings & History
- **Elements**: Ratings, past jobs, disputes.
- **Actions**: View/respond.

### 12. Support & Safety
- **Elements**: SOS button, FAQs, hotline.
- **Actions**: Trigger SOS.

---

## Rider Flow (MVP)

### 1. Splash / Login
- **Elements**: Phone OTP, language choice.
- **Actions**: Verify login.

### 2. Availability / Go Online
- **Elements**: Online/offline toggle, location ping, vehicle type.
- **Actions**: Mark available.

### 3. Incoming Job Notification
- **Elements**: Job card with pickup, ETA, fee, timer.
- **Actions**: Accept/decline.

### 4. Job Details (Before Pickup)
- **Elements**: Pickup info, buyer address, special instructions.
- **Actions**: Navigate, call, cancel if needed.

### 5. Arrival & Pickup Verification
- **Elements**: QR/code verification, optional photo.
- **Actions**: Confirm pickup.

### 6. Start Trip → Navigation
- **Elements**: Live map, ETA, status = En route.
- **Actions**: Navigate, report delay.

### 7. Delivery Confirmation
- **Elements**: Checklist, OTP/signature/photo.
- **Actions**: Confirm delivery, mark attempt.

### 8. Earnings & Wallet
- **Elements**: Balance, pending vs available, withdraw.
- **Actions**: Request withdrawal.

### 9. History & Ratings
- **Elements**: Past jobs, disputes, ratings.
- **Actions**: View/respond.

### 10. Support & Safety
- **Elements**: SOS button, emergency contact, chat.
- **Actions**: Trigger support.

### 11. Profile & Settings
- **Elements**: Rider profile, vehicle info, payout details.
- **Actions**: Edit profile, upload docs.

---

## Admin Flow (MVP)

### 1. Login
- **Fields**: Email, Password  
- **Button**: Login  
- **Error handling**: Show message on invalid credentials  

### 2. Dashboard (Home)
- **KPIs at a glance**:  
  - Active Riders  
  - Active Drivers  
  - Ongoing Trips  
  - Daily Revenue  
  - Issues flagged  

### 3. User Management
#### a) Riders
- **List**: Name, Phone, Email, Join Date, Status  
- **Actions**: View Details | Suspend/Unsuspend  

#### b) Drivers
- **List**: Name, Phone, Vehicle, Status, Rating  
- **Actions**: View Details | Approve/Reject | Suspend/Unsuspend  
- **Document Verification**: License, ID, Insurance  

### 4. Trips Management
- **Table**: Trip ID, Rider, Driver, Fare, Status, Date/Time  
- **Filters**: Rider, Driver, Status (Completed, Cancelled, Ongoing)  
- **Actions**: Cancel Trip (fraud/system issues)  

### 5. Payments & Earnings
- **Earnings Dashboard**: Total revenue, Commission cut  
- **Transaction List**: Trip ID, Driver earnings, Platform share, Date  
- **Export**: CSV  

### 6. Support / Issues
- **Complaints List**: User type (Rider/Driver), Message, Date  
- **Actions**: Mark as Resolved | Escalate  

### 7. Settings (Basic)
- **Fare Management**: Base fare, Per km, Per minute rates  
- **Toggle**: Surge pricing (optional MVP+)  
- **Promo Codes**: Add, Edit, Deactivate (optional)  



## Notes
- This file is meant for **screen-by-screen clarity**.
- Use it with `SPEC.md` (functional requirements).
- Together, they give a **full picture** of what to build:  
  - `SPEC.md` = what features/flows exist.  
  - `USER_FLOWS.md` = how those flows look and behave screen by screen.
