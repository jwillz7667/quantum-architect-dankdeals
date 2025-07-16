# Resend Broadcast Template Instructions

## 🎯 How to Use These Templates in Resend

### Option 1: Simple Template (Recommended)

**File: `resend-broadcast-simple.html`**

1. **Copy the template:**
   - Open `resend-broadcast-simple.html`
   - Select all content (Ctrl/Cmd + A)
   - Copy to clipboard (Ctrl/Cmd + C)

2. **Create broadcast in Resend:**
   - Go to [Resend Dashboard](https://resend.com/broadcasts)
   - Click "Create Broadcast"
   - Choose "Custom HTML" editor
   - Paste the template code

3. **Customize the content:**
   - Replace `Order #20250715-0001` with actual order number
   - Replace `John` with customer name
   - Update order items, prices, and totals
   - Change delivery address information
   - Adjust tip calculations based on actual total

### Option 2: Advanced Template with Variables

**File: `resend-broadcast-template.html`**

This version includes placeholder variables like `{{order_number}}`, `{{customer_name}}`, etc. that you can replace programmatically or manually.

## 📧 Template Features

### ✨ Professional Design

- **Cannabis-themed branding** with green gradient header
- **Mobile-responsive** layout that works on all devices
- **Professional typography** with clear hierarchy
- **DankDeals MN branding** throughout

### 📦 Order Information Sections

- **Header with order number badge**
- **Itemized order details** with quantities and weights
- **Delivery address and timeline**
- **Complete order summary** with tax and fees
- **Payment instructions** for cash on delivery

### 💡 Customer Experience Features

- **Tip calculator** with 15%, 18%, 20% suggestions
- **Important reminders** about ID and cash payment
- **Contact information** for support
- **Legal compliance** notices for cannabis

### 🎨 Visual Elements

- **Cannabis leaf emoji** in branding
- **Professional color scheme** (green cannabis theme)
- **Rounded corners** and modern styling
- **Gradient backgrounds** for visual appeal
- **Clear section separation** with borders

## 🛠 Customization Guide

### Quick Customization Checklist:

- [ ] Update order number
- [ ] Change customer name
- [ ] Replace order items with actual products
- [ ] Update quantities, weights, and prices
- [ ] Change delivery address
- [ ] Recalculate totals (subtotal, tax, delivery, total)
- [ ] Update tip suggestions based on new total
- [ ] Verify contact information

### Variable Replacements:

```
{{order_number}} → 20250715-0001
{{customer_name}} → John Doe
{{delivery_address}} → 123 Main Street Apt 4B
{{delivery_city}} → Minneapolis
{{delivery_state}} → MN
{{delivery_zip}} → 55401
{{delivery_phone}} → (763) 247-5378
{{subtotal}} → 117.00
{{tax_amount}} → 11.99
{{delivery_fee}} → 5.00
{{total_amount}} → 133.99
{{tip_15_percent}} → 20.10
{{tip_18_percent}} → 24.12
{{tip_20_percent}} → 26.80
```

## 📱 Mobile Optimization

The template includes:

- **Responsive design** that stacks elements on mobile
- **Touch-friendly** buttons and links
- **Readable fonts** at all screen sizes
- **Proper spacing** for mobile viewing

## 🚀 Best Practices

1. **Test before sending:**
   - Preview on desktop and mobile
   - Check all links work correctly
   - Verify calculations are accurate

2. **Legal compliance:**
   - Keep age verification notices
   - Include cannabis disclaimers
   - Maintain required legal text

3. **Brand consistency:**
   - Keep DankDeals MN branding
   - Use consistent colors and fonts
   - Maintain professional tone

## 📧 Sending Tips

- **Subject line suggestion:** `Order Confirmation #[ORDER_NUMBER] - DankDeals MN`
- **From address:** `orders@dankdealsmn.com` or `DankDeals MN <orders@dankdealsmn.com>`
- **Reply-to:** `support@dankdealsmn.com`

## 🔗 Integration with Existing System

These templates match the design of the automated emails in the main application, ensuring consistent branding across all customer communications.
