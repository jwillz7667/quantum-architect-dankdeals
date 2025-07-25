#!/bin/bash

# Google OAuth Setup Script for DankDeals
# Run this script after installing gcloud CLI and logging in

echo "🚀 Setting up Google OAuth for DankDeals..."

# Set your project ID (replace with your actual project ID)
PROJECT_ID="your-project-id-here"

# Set the project
echo "📝 Setting project to $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling Google+ API..."
gcloud services enable plus.googleapis.com

echo "🔌 Enabling OAuth2 API..."
gcloud services enable oauth2.googleapis.com

# Note: OAuth client creation via CLI is limited
# You'll need to create the OAuth client manually in the console
echo "⚠️  Manual step required:"
echo "   Go to: https://console.cloud.google.com/apis/credentials"
echo "   Create OAuth client ID with these settings:"
echo ""
echo "📍 Authorized JavaScript origins:"
echo "   - http://localhost:8082"
echo "   - https://dankdealsmn.com"
echo ""
echo "📍 Authorized redirect URIs:"
echo "   - http://localhost:8082/auth/callback"
echo "   - https://dankdealsmn.com/auth/callback"
echo ""
echo "✅ After creating, add the client ID to your Supabase project:"
echo "   - Go to Supabase Dashboard > Authentication > Providers"
echo "   - Enable Google provider"
echo "   - Add your Client ID and Client Secret"

echo "🎉 Setup script completed!"