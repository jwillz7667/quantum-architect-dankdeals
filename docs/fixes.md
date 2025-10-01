Product Listing & Admin Dashboard Audit - Complete

🔴 CRITICAL ISSUES (Fix Immediately)

1. RLS Security Vulnerability - products & product_variants tables

- Issue: RLS is currently DISABLED (we just did this to fix 401 errors)
- Risk: Anyone can modify/delete products via API
- Fix Needed: Re-enable RLS with proper anon-friendly SELECT policies
- Status: We disabled this temporarily - need to implement correctly

2. Admin Authorization Bypass Risk - src/lib/admin/products.ts

- Issue: Admin check uses client-side raw_app_meta_data which can be spoofed
- Risk: Non-admins could access admin endpoints
- Fix Needed: Check profiles.role = 'admin' server-side via RLS policies

---

🟠 HIGH PRIORITY (Important Functionality)

3. Missing Pagination - src/pages/Shop.tsx & AdminProducts.tsx

- Issue: Loading ALL products at once - will crash with large catalog
- Impact: Performance degradation, poor UX
- Fix: Implement cursor-based pagination

4. No Product Image Upload - Admin dashboard

- Issue: Hardcoded URLs only - no Supabase Storage integration
- Impact: Admins can't upload product images
- Fix: Add image upload to AdminProductForm

5. Missing Real-time Updates - Product listing

- Issue: No Supabase subscriptions for live inventory updates
- Impact: Stale data shown to users
- Fix: Add real-time listeners for stock changes

6. No Bulk Operations - Admin dashboard

- Issue: Can't bulk delete, activate/deactivate products
- Impact: Poor admin UX for managing many products
- Fix: Add bulk action checkboxes

---

🟡 MEDIUM PRIORITY (UX & Performance)

7. Missing Loading Skeletons - Product cards
8. No Optimistic Updates - Cart/inventory operations
9. Missing Product Search - No search by name/category
10. No Product Sorting - Can't sort by price, popularity, etc.
11. Missing Error Boundaries - App crashes on errors

---

🟢 LOW PRIORITY (Code Quality)

12. TypeScript strictness - Some any types
13. Missing unit tests - Product components untested
14. Code duplication - Duplicate ProductCard components
15. Missing JSDoc comments - Poor documentation

---

🎯 What Do You Want to Fix First?

I recommend this order:

1. Fix RLS properly (CRITICAL - 10 min)
2. Add pagination (HIGH - 30 min)
3. Fix admin auth (CRITICAL - 20 min)
4. Add image upload (HIGH - 45 min)
