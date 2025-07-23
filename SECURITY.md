# Security Documentation

This document outlines the security measures implemented in the DankDeals application.

## XSS Prevention

### 1. Input Sanitization

- **Location**: `src/lib/sanitize.ts`
- **Implementation**: All user inputs are sanitized using DOMPurify
- **Functions**:
  - `sanitizeText()`: Removes all HTML tags and encodes special characters
  - `sanitizeHtml()`: Allows specific HTML tags while blocking scripts
  - `sanitizeEmail()`: Validates and sanitizes email addresses
  - `sanitizePhone()`: Removes non-numeric characters from phone numbers
  - `sanitizeZipCode()`: Ensures only 5-digit zip codes
  - `validateInput()`: Generic validator with length and content checks

### 2. HTML Content Sanitization

- **Location**: `src/pages/BlogPost.tsx`
- **Implementation**: Blog content is sanitized using DOMPurify before rendering
- **Configuration**: Only allows safe HTML tags (h1-h6, p, ul, ol, li, strong, em, br, table elements)

### 3. Form Input Protection

- **Location**: `src/pages/checkout/CheckoutAddress.tsx`
- **Implementation**: All form inputs are sanitized in real-time
- **Coverage**: Personal information, address fields, delivery instructions

### 4. Search Query Sanitization

- **Location**: `src/hooks/useProductsFilter.tsx`
- **Implementation**: Search queries are sanitized before being stored in state

## Content Security Policy (CSP)

### 1. Meta Tag Implementation

- **Location**: `index.html`
- **Policy**: Restrictive CSP that only allows necessary resources
- **Directives**:
  - `default-src 'self'`: Only load resources from same origin
  - `script-src 'self' 'unsafe-inline' https://plausible.io`: Allow scripts from self and analytics
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`: Allow styles from self and Google Fonts
  - `font-src 'self' https://fonts.gstatic.com`: Allow fonts from self and Google
  - `img-src 'self' data: https: blob:`: Allow images with restrictions
  - `connect-src`: Restrict API connections to Supabase and analytics
  - `frame-ancestors 'none'`: Prevent embedding in frames
  - `base-uri 'self'`: Restrict base URI
  - `form-action 'self'`: Restrict form submissions

### 2. HTTP Headers Implementation

- **Location**: `public/_headers` (Netlify) and `index.html` (meta tags)
- **Headers**:
  - `X-Frame-Options: DENY`: Prevent clickjacking
  - `X-Content-Type-Options: nosniff`: Prevent MIME sniffing
  - `Referrer-Policy: strict-origin-when-cross-origin`: Control referrer information
  - `X-XSS-Protection: 1; mode=block`: Enable XSS filtering (legacy browsers)
  - `Strict-Transport-Security`: Enforce HTTPS connections
  - `Permissions-Policy`: Disable unnecessary browser features

## Additional Security Measures

### 1. Secure Font Loading

- **Issue**: Removed potentially vulnerable custom font (bio-sans.otf)
- **Solution**: Replaced with system fonts to eliminate attack vector

### 2. Input Validation

- **Email Validation**: Regex validation combined with sanitization
- **Phone Validation**: Numeric-only validation with formatting
- **Age Verification**: Server-side age calculation validation
- **Address Validation**: Length limits and character restrictions

### 3. Environment Security

- **Secrets Management**: No hardcoded secrets in client code
- **API Keys**: Supabase keys are properly configured for client-side use
- **Environment Variables**: Sensitive data in environment variables only

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security (sanitization, CSP, HTTP headers)
2. **Input Validation**: All user inputs validated and sanitized
3. **Output Encoding**: All dynamic content properly encoded
4. **Secure Headers**: Comprehensive security header implementation
5. **Minimal Permissions**: CSP and Permissions Policy restrict unnecessary features
6. **HTTPS Enforcement**: Strict Transport Security header enforces secure connections

## Security Testing

### Automated Checks

- DOMPurify sanitization tests
- Input validation unit tests
- CSP violation monitoring

### Manual Security Review

- XSS vulnerability assessment completed
- Input validation testing completed
- CSP policy validation completed

## Incident Response

If you discover a security vulnerability, please:

1. Do not publicly disclose the issue
2. Contact the development team immediately
3. Provide detailed reproduction steps
4. Allow time for patching before public disclosure

## Security Updates

This document should be updated whenever:

- New security measures are implemented
- Security policies are changed
- Vulnerabilities are discovered and patched
- Dependencies are updated for security reasons

---

**Last Updated**: January 2025  
**Security Review Status**: ✅ Complete  
**Next Review Date**: March 2025
