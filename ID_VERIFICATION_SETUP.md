# ID Verification System Setup Guide

## Overview
The ID verification system allows users to submit photos of their government-issued IDs for manual review by team members. This ensures compliance with Minnesota cannabis laws requiring age verification.

## System Components

### 1. User Flow
1. **Upload**: Users upload a clear photo of their government-issued ID
2. **Submit**: ID is stored securely in Supabase storage
3. **Review**: Team members review submissions via admin interface
4. **Approval**: IDs are approved or rejected with reasons

### 2. Key Files
- `src/components/IDVerification.tsx` - User-facing upload interface
- `src/components/IDVerificationAdmin.tsx` - Admin review interface
- `src/pages/Admin.tsx` - Admin panel page
- `supabase/migrations/20250702195844-da796f52-eb82-481b-b007-50f249ba9ea7.sql` - Database setup

## Database Setup

### Required Migrations
Run the following SQL in your Supabase dashboard or via CLI:

```sql
-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'not_submitted' 
CHECK (verification_status IN ('not_submitted', 'pending_review', 'approved', 'rejected'));

-- Create storage policies
CREATE POLICY "Users can upload their own ID documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "Users can view their own ID documents" ON storage.objects
FOR SELECT USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Admin policies (update as needed for your admin role system)
CREATE POLICY "Admins can view all ID documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.id_verification_data->>'role' = 'admin' OR profiles.id_verification_data->>'role' = 'reviewer')
  )
);
```

## Admin Access

### Setting Up Admin Users
To grant admin access to team members:

1. **Via SQL** (temporary for testing):
```sql
UPDATE public.profiles 
SET id_verification_data = jsonb_build_object('role', 'admin')
WHERE user_id = 'USER_UUID_HERE';
```

2. **Via Application** (recommended):
Create a proper admin role system in your application.

### Accessing Admin Panel
- Navigate to `/admin` when signed in as an admin user
- Review pending submissions in the "Pending" tab
- Approve or reject IDs with one click

## Security Features

### Storage Security
- Private bucket (not publicly accessible)
- Users can only upload/view their own documents
- Admins have controlled access to all documents
- File size limit (10MB) and type restrictions

### Data Protection
- No personal ID data stored in database
- Only metadata and review status tracked
- Secure upload with authentication required

## Usage Instructions

### For Users
1. Sign up for account
2. Upload clear photo of government-issued ID
3. Wait for email notification of review completion
4. Account features unlocked upon approval

### For Admin Team
1. Access `/admin` page
2. Review pending submissions
3. Examine ID photo for:
   - Clarity and readability
   - Valid government-issued document
   - Age 21+ verification
4. Approve or reject with reason

## Verification Status Flow

```
not_submitted → pending_review → approved/rejected
                      ↓
              (Email notification sent)
```

## File Structure
```
src/
├── components/
│   ├── IDVerification.tsx          # User upload interface
│   └── IDVerificationAdmin.tsx     # Admin review interface  
├── pages/
│   ├── Admin.tsx                   # Admin panel page
│   └── Auth.tsx                    # Updated signup flow
└── integrations/supabase/
    └── types.ts                    # Updated database types
```

## Testing the System

### 1. User Upload Test
1. Create new account
2. Upload test ID image during signup
3. Verify image stored in Supabase storage
4. Check `verification_status` = 'pending_review'

### 2. Admin Review Test  
1. Access `/admin` as admin user
2. See pending submission
3. Review and approve/reject
4. Verify status updated in database

## Production Considerations

### Required Setup
1. Configure Supabase storage bucket
2. Set up admin user roles
3. Configure email notifications
4. Test storage policies
5. Set up backup/retention policies

### Security Checklist
- [ ] Storage bucket is private
- [ ] File upload policies working
- [ ] Admin access properly restricted
- [ ] File size/type limits enforced
- [ ] Image retention policy defined

## Troubleshooting

### Common Issues
1. **Storage bucket not found**: Run bucket creation SQL
2. **Upload fails**: Check storage policies and authentication
3. **Admin can't see submissions**: Verify admin role in profile
4. **Images not loading**: Check storage bucket permissions

### Debug Steps
1. Check browser developer tools for errors
2. Verify Supabase storage bucket exists
3. Test authentication and user sessions
4. Check database table structure matches expectations 