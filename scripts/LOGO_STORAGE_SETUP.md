# Logo Storage Setup

This document explains how to set up and use logo storage in Supabase.

## Prerequisites

1. Ensure you have the following environment variables set in `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY` (for initial setup only)

## Setup Instructions

### 1. Run the Setup Script

First, compile the TypeScript file:

```bash
cd scripts
npm install
npx tsc setup-logo-storage.ts
cd ..
```

Then run the compiled JavaScript:

```bash
node scripts/setup-logo-storage.js
```

Alternatively, you can use ts-node if installed:

```bash
npx ts-node scripts/setup-logo-storage.ts
```

This script will:

- Create a `logos` bucket in Supabase Storage if it doesn't exist
- Set the bucket to public access
- Upload the white logo (`white-logo-trans.webp`) from `/public/logos/`
- Display the public URL for the uploaded logo

### 2. Apply Storage Policies (Optional)

If you want to restrict upload/update/delete operations to admins only, run the migration:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20240802_logos_storage_policies.sql
```

## Usage in Your Application

### Using the Helper Functions

```typescript
import { getWhiteLogoUrl, getLogoUrl } from '@/lib/logoStorage';

// Get the white logo URL
const whiteLogoUrl = getWhiteLogoUrl();

// Or get any logo by filename
const logoUrl = getLogoUrl('white-logo-trans.webp');
```

### Direct Usage with Supabase Client

```typescript
import { supabase } from '@/integrations/supabase/client';

// Get public URL for a logo
const { data } = supabase.storage.from('logos').getPublicUrl('white-logo-trans.webp');

const logoUrl = data.publicUrl;
```

### In React Components

```tsx
import { getWhiteLogoUrl } from '@/lib/logoStorage';

function Header() {
  const logoUrl = getWhiteLogoUrl();

  return <img src={logoUrl} alt="Dank Deals Logo" className="h-12 w-auto" />;
}
```

## Public URL Structure

The public URL for logos follows this pattern:

```
https://[your-project-id].supabase.co/storage/v1/object/public/logos/[filename]
```

Example:

```
https://abc123.supabase.co/storage/v1/object/public/logos/white-logo-trans.webp
```

## Storage Bucket Configuration

- **Bucket Name**: `logos`
- **Public Access**: Yes
- **File Size Limit**: 5MB
- **Allowed MIME Types**:
  - image/webp
  - image/jpeg
  - image/png
  - image/jpg
  - image/svg+xml

## Troubleshooting

1. **Missing environment variables**: Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local`

2. **Upload fails**: Check that:
   - The logo file exists at `/public/logos/white-logo-trans.webp`
   - You have the correct service role key
   - The file size is under 5MB

3. **Public URL not working**: Verify that the bucket is set to public in Supabase dashboard

## Adding More Logos

To add additional logos:

1. Place the logo file in `/public/logos/`
2. Modify the setup script or use the Supabase dashboard
3. Update the `LOGO_URLS` constant in `/src/lib/logoStorage.ts`
