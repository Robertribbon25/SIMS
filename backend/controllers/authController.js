import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mysupersecretkey', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Google OAuth Authorization URL or fallback picker URL
// @route   GET /api/auth/google/url
// @access  Public
export const getGoogleAuthUrl = async (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
    : `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  if (googleClientId) {
    // Real Google OAuth URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    return res.json({ 
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      isSimulated: false 
    });
  } else {
    // Fallback Picker URL
    const pickerUrl = `/api/auth/google/picker`;
    return res.json({
      url: pickerUrl,
      isSimulated: true
    });
  }
};

// @desc    Serve Simulated Google Account Picker
// @route   GET /api/auth/google/picker
// @access  Public
export const googlePickerPage = (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in - Google Accounts</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          background-color: #f0f4f9;
        }
        .g-card {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          background-color: #ffffff;
        }
      </style>
    </head>
    <body class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-[440px] g-card rounded-2xl border border-[#dadce0] p-6 md:p-8 transition-all">
        <!-- Google Logo SVG -->
        <div class="flex justify-center mb-5">
          <svg class="h-6" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38C16.88,15.75,14.77,17,12,17c-3.33,0-6-2.67-6-6s2.67-6,6-6c1.6,0,3.04,0.63,4.12,1.64l2-2C16.29,2.83,14.28,2,12,2A9,9,0,0,0,3,11a9,9,0,0,0,9,9c5,0,8.35-3.52,8.35-8.5A7.47,7.47,0,0,0,21.35,11.1Z" fill="#4285F4"/>
              <path d="M3,11a9,9,0,0,0,9,9c2.42,0,4.58-0.91,6.21-2.4l-2.4-1.85A5.88,5.88,0,0,1,12,17c-3.33,0-6-2.67-6-6C6,7.42,8.18,5.15,11,4.72l-2-2A9,9,0,0,0,3,11Z" fill="#EA4335"/>
              <path d="M12,2A9,9,0,0,0,3,11c0,0.34,0.02,0.67,0.05,1l2.4-2c0-.33-.05-.66-.05-1a6,6,0,0,1,6-6C14.28,3,16.29,3.83,18.12,5.18l2-2A9,9,0,0,0,12,2Z" fill="#FBBC05"/>
              <path d="M21.35,11.1A7.47,7.47,0,0,0,20.35,9H12v3h5.38C17.15,13.27,15.42,14.73,13.2,15.6l2.4,1.85C18.66,15.35,21.35,11.1,21.35,11.1Z" fill="#34A853"/>
            </g>
          </svg>
        </div>

        <div class="text-center mb-6">
          <h1 class="text-xl text-[#202124] font-medium tracking-tight mb-1">Choose an account</h1>
          <p class="text-[13px] text-[#5f6368]">to continue to <span class="font-medium text-[#1a73e8]">SIMS Rwanda</span></p>
        </div>

        <!-- Account List -->
        <div class="space-y-1 mb-5 border-t border-[#f1f3f4] pt-2">
          <!-- Item 1 -->
          <button onclick="selectProfile('System Admin', 'admin@gmail.com')" class="w-full flex items-center justify-between p-3.5 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4] text-left">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-medium text-xs">SA</div>
              <div>
                <p class="text-[13px] font-medium text-[#3c4043]">System Admin</p>
                <p class="text-[11px] text-[#5f6368]">admin@gmail.com</p>
              </div>
            </div>
            <span class="text-[9px] bg-[#e8f0fe] text-[#1a73e8] font-bold px-1.5 py-0.5 rounded">DEFAULT</span>
          </button>

          <!-- Item 2 -->
          <button onclick="selectProfile('Chief Examiner', 'examiner.tss@gmail.com')" class="w-full flex items-center p-3.5 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4] text-left">
            <div class="w-9 h-9 rounded-full bg-[#e37400] text-white flex items-center justify-center font-medium text-xs">CE</div>
            <div class="ml-3">
              <p class="text-[13px] font-medium text-[#3c4043]">Chief Examiner</p>
              <p class="text-[11px] text-[#5f6368]">examiner.tss@gmail.com</p>
            </div>
          </button>

          <!-- Item 3 -->
          <button onclick="selectProfile('Store Supervisor', 'supervisor.tss@gmail.com')" class="w-full flex items-center p-3.5 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4] text-left">
            <div class="w-9 h-9 rounded-full bg-[#137333] text-white flex items-center justify-center font-medium text-xs">SS</div>
            <div class="ml-3">
              <p class="text-[13px] font-medium text-[#3c4043]">Store Supervisor</p>
              <p class="text-[11px] text-[#5f6368]">supervisor.tss@gmail.com</p>
            </div>
          </button>

          <!-- Standard Custom Row -->
          <button onclick="toggleCustomForm()" class="w-full flex items-center p-3.5 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4] text-left">
            <div class="w-9 h-9 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-[13px] font-medium text-[#1a73e8]">Use another account</p>
              <p class="text-[11px] text-[#5f6368]">Sign in with any other custom email</p>
            </div>
          </button>
        </div>

        <!-- Custom Account Form (hidden by default) -->
        <form id="customForm" class="hidden space-y-3 mb-5 border border-[#dadce0] p-3 rounded-lg bg-[#f8f9fa]" onsubmit="submitCustom(event)">
          <div>
            <label class="block text-[10px] font-semibold text-gray-600 mb-0.5 uppercase">Staff Name</label>
            <input type="text" id="customName" required placeholder="John Doe" class="w-full px-2.5 py-1 text-xs border border-[#dadce0] rounded focus:outline-none focus:border-[#1a73e8]">
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-gray-600 mb-0.5 uppercase">Gmail Address</label>
            <input type="email" id="customEmail" required placeholder="john.doe@gmail.com" class="w-full px-2.5 py-1 text-xs border border-[#dadce0] rounded focus:outline-none focus:border-[#1a73e8]">
          </div>
          <button type="submit" class="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium py-1.5 rounded transition-all">
            Authorized custom identity
          </button>
        </form>

        <div class="text-[11px] text-[#5f6368] leading-relaxed">
          To connect real production Google Credentials, define <code class="bg-gray-100 px-1 py-0.5 rounded text-rose-600 font-mono">GOOGLE_CLIENT_ID</code> and <code class="bg-gray-100 px-1 py-0.5 rounded text-rose-600 font-mono">GOOGLE_CLIENT_SECRET</code> on your AI Studio Secrets panel.
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center text-[11px] text-[#70757a] mt-6 pt-3 border-t border-[#f1f3f4]">
          <div class="hover:text-[#3c4043] cursor-pointer">English (United States)</div>
          <div class="flex space-x-2.5">
            <span class="hover:text-[#3c4043] cursor-pointer">Help</span>
            <span class="hover:text-[#3c4043] cursor-pointer">Privacy</span>
            <span class="hover:text-[#3c4043] cursor-pointer">Terms</span>
          </div>
        </div>
      </div>

      <script>
        function toggleCustomForm() {
          const form = document.getElementById('customForm');
          form.classList.toggle('hidden');
        }

        function selectProfile(username, email) {
          submitAuth(username, email);
        }

        function submitCustom(e) {
          e.preventDefault();
          const username = document.getElementById('customName').value;
          const email = document.getElementById('customEmail').value;
          submitAuth(username, email);
        }

        async function submitAuth(username, email) {
          try {
            const res = await fetch('/api/auth/google/simulate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, email })
            });
            const data = await res.json();
            
            if (data.success && window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: data.token,
                user: data.user
              }, '*');
              window.close();
            } else {
              alert('Simulation login failed: ' + (data.message || 'Unknown error'));
            }
          } catch (err) {
            alert('Simulation server connection failed: ' + err.message);
          }
        }
      </script>
    </body>
    </html>
  `);
};

// @desc    Simulate login from Google Picker Form
// @route   POST /api/auth/google/simulate
// @access  Public
export const googleSimulate = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Gmail address is mandatory' });
    }

    // Find or automatically register
    const finalEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: finalEmail });
    if (!user) {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 12) + '@Sim123', salt);
      user = await User.create({
        username: username || finalEmail.split('@')[0],
        email: finalEmail,
        password: hashedPassword
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Google Simulation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Real Google OAuth Callback Handler
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  const { code } = req.query;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
    : `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  try {
    if (!code) {
      throw new Error("No authorization code returned from Google Identity");
    }

    // Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Identity exchange failed');
    }

    const { access_token } = tokenData;

    // Fetch user profile info
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const profileData = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new Error('Could not retrieve Google profile details.');
    }

    const { email, name } = profileData;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 12) + '@Sim123', salt);
      user = await User.create({
        username: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashedPassword
      });
    }

    const token = generateToken(user._id);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${token}',
                user: ${JSON.stringify({ _id: user._id, username: user.username, email: user.email })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <p>Authentication successful. Connecting session, please wait...</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Google AuthCallback error:", error.message);
    res.status(500).send(`
      <html>
        <body>
          <div style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #dc2626;">
            <h2>Google Authentication Failed</h2>
            <p>${error.message}</p>
            <hr style="max-width: 400px; margin: 20px auto; border-color: #fca5a5;">
            <button onclick="window.close()" style="background: #3c4043; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }
};

