require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_pec_jwt_secret_change_in_production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '525912195711-gspvd24nog749cf3lg7hti2s0pc14p12.apps.googleusercontent.com';
const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || 'pec.edu.in').toLowerCase();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ─── Authentication Middleware ───
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { email, name, picture, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// ─── Google Auth Route (pec.edu.in enforcement) ───
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'No credential provided' });
  }

  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = (payload['email'] || '').toLowerCase();
    const name = payload['name'] || email;
    const picture = payload['picture'] || null;

    // Enforce PEC institutional email domain
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return res.status(403).json({ error: `Only official @${ALLOWED_DOMAIN} emails are allowed.` });
    }

    const user = {
      email,
      name,
      picture,
      role: 'student',
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(401).json({ error: 'Authentication failed with Google' });
  }
});

// ─── Dev Login Route (Fallback during testing) ───
app.post('/api/auth/dev-login', (req, res) => {
  const user = {
    email: 'student@pec.edu.in',
    name: 'PEC Student (Dev)',
    picture: null,
    role: 'student',
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ message: 'Dev login successful', user });
});

// ─── Get Current User ───
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ─── Logout ───
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ─── Chat Route (Syncloop Integration Ready) ───
app.post('/api/chat', requireAuth, async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Empty message' });
  }

  // 1. If Syncloop API URL is configured in environment, call Syncloop:
  if (process.env.SYNCLOOP_API_URL) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.SYNCLOOP_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.SYNCLOOP_API_KEY}`;
      }

      const syncloopRes = await fetch(process.env.SYNCLOOP_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: message,
          history: history || [],
          user: { email: req.user.email },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!syncloopRes.ok) {
        throw new Error(`Syncloop responded with status ${syncloopRes.status}`);
      }

      const data = await syncloopRes.json();
      return res.json({
        status: data.status || 'answer',
        answer: data.answer || data.reply || data.text || '',
        sources: data.sources || [],
        contact: data.contact || null,
        suggestions: data.suggestions || [],
        syncloop: true,
      });
    } catch (err) {
      console.error('Syncloop request failed:', err);
      return res.status(500).json({
        status: 'error',
        answer: 'Failed to retrieve answer from Syncloop AI service. Please try again.',
        sources: [],
      });
    }
  }

  // 2. Default Built-in PEC Knowledge Base Mock Response
  await new Promise((r) => setTimeout(r, 600));

  const lower = message.toLowerCase();
  let answer = 'Thank you for reaching out to the PEC Assistant. Official academic notices, guidelines, and departmental updates can be checked on the PEC academic portal.';
  let sources = [{ title: 'PEC Academic Regulations & Handbook', page: 'General', date: '2026-08-01', url: 'https://pec.ac.in' }];

  if (lower.includes('attendance')) {
    answer = 'Under Punjab Engineering College academic regulations, students are required to maintain a minimum attendance of **75%** in all registered courses to be eligible for end-semester examinations. Condonation up to 10% may be permitted under valid medical grounds.';
    sources = [{ title: 'PEC Academic Rules & Ordinance', page: 'Sec 4.2 (Attendance)', date: '2026', url: 'https://pec.ac.in' }];
  } else if (lower.includes('fee')) {
    answer = 'Semester fees must be paid through the official PEC AIS / SBI Collect portal prior to the deadline indicated in the academic calendar. Late registrations incur prescribed fine penalties.';
    sources = [{ title: 'PEC Fee Structure Circular 2026-27', page: 'Page 1-2', date: '2026-06-15', url: 'https://pec.ac.in' }];
  } else if (lower.includes('scholarship')) {
    answer = 'PEC offers Merit-cum-Means (MCM) scholarships, fee concessions for reserved categories, and departmental teaching assistantships for postgraduate scholars.';
    sources = [{ title: 'PEC Scholarship & Financial Aid Guidelines', page: 'Page 3', date: '2026', url: 'https://pec.ac.in' }];
  } else if (lower.includes('hostel')) {
    answer = 'Hostel allotment is managed centrally through the Chief Warden Office. Applications open at the beginning of each academic session based on merit and distance criteria.';
    sources = [{ title: 'PEC Hostel Rules & Allotment Procedure', page: 'Rules & Allotment', date: '2026', url: 'https://pec.ac.in' }];
  }

  return res.json({
    status: 'answer',
    answer,
    sources,
    suggestions: [
      'What is the minimum attendance required?',
      'How to pay semester fees?',
      'Hostel admission procedure'
    ],
    mock: true,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PEC Chatbot Server running on http://localhost:${PORT}`);
});
