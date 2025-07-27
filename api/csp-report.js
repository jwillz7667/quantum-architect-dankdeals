// CSP Violation Reporting Endpoint
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const violation = req.body;

    // Log CSP violations (in production, you'd want to send this to a logging service)
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      violation: violation,
    });

    // In production, you might want to:
    // - Send to a security monitoring service
    // - Store in a database
    // - Alert security team for repeated violations

    res.status(204).end(); // No content response
  } catch (error) {
    console.error('Error processing CSP report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
