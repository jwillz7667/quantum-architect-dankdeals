# Google Analytics Setup Guide

## Recommended Approach: Using Google Tag Manager (You already have GTM!)

Since you already have Google Tag Manager (GTM-NFKK7D37) installed, this is the easiest way:

### Step 1: Get Google Analytics 4 (GA4) Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for dankdealsmn.com
3. Get your Measurement ID (format: G-XXXXXXXXXX)

### Step 2: Configure GTM

1. Log into [Google Tag Manager](https://tagmanager.google.com/)
2. Select your container (GTM-NFKK7D37)
3. Add a new tag:
   - Click "New Tag"
   - Choose "Google Analytics: GA4 Configuration"
   - Enter your Measurement ID
   - Trigger: All Pages
   - Save and name it "GA4 Configuration"

### Step 3: Set Up E-commerce Events

Your code already sends these events to GTM:

- `view_item` - When user views a product
- `add_to_cart` - When user adds to cart
- `remove_from_cart` - When user removes from cart
- `begin_checkout` - When user starts checkout
- `purchase` - When order is completed
- `search` - When user searches
- `sign_up` - When user signs up
- `login` - When user logs in

For each event, create a tag in GTM:

1. New Tag → Google Analytics: GA4 Event
2. Configuration Tag: Select your GA4 Configuration tag
3. Event Name: Use the exact event name (e.g., "view_item")
4. Event Parameters: Add from DataLayer Variables
5. Trigger: Custom Event → Event name equals [event_name]

### Step 4: Publish GTM Container

1. Click "Submit" in GTM
2. Add version name and description
3. Publish

## Alternative: Direct Implementation

If you prefer not to use GTM:

### Step 1: Add Environment Variable

Add to your `.env.local`:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 2: Add to App.tsx

```tsx
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

// Inside your App component, add:
<GoogleAnalytics />;
```

### Step 3: Update Events

Replace GTM events with GA4 events in your components:

```tsx
import { GA4Events } from '@/lib/google-analytics';

// Instead of GTMEvents.viewItem(), use:
GA4Events.viewItem({
  currency: 'USD',
  value: product.price,
  items: [
    {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1,
    },
  ],
});
```

## Verification

### For GTM Approach:

1. Install [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Visit your site
3. Check that GA4 tags are firing

### For Direct Implementation:

1. Open Chrome DevTools → Network tab
2. Filter by "collect"
3. Navigate your site and verify GA4 hits are sent

## Important Events to Track

Your app already tracks these key e-commerce events:

- Product views
- Add to cart
- Remove from cart
- Checkout steps
- Purchases
- Search queries
- User registration/login
- Age verification
- Delivery area selection

## Debugging

Enable debug mode in development:

```javascript
// For GTM
window.dataLayer.push({ debug_mode: true });

// For direct GA4
window.gtag('config', 'G-XXXXXXXXXX', {
  debug_mode: true,
});
```

## Best Practices

1. **Use GTM** - Since you already have it, this is the cleanest approach
2. **Test in Preview** - Always test in GTM Preview mode before publishing
3. **Check Real-time** - Use GA4 Real-time reports to verify events
4. **Don't double-track** - Use either GTM or direct implementation, not both
5. **Privacy Compliance** - Ensure your privacy policy mentions Google Analytics

## Next Steps

1. Create your GA4 property
2. Set up in GTM (recommended)
3. Test all events
4. Monitor in GA4 dashboard
