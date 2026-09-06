import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validatePassword } from '../utils/validatePassword.js';

// Utility to generate JWT
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not configured.');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Utility to send token in secure HTTP-only cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      data: {
        user: user.toSafeObject(),
        token, // Included for authorization headers if needed
      },
    });
};

const slugify = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ensureCompany = async (name, email) => {
  const companyName = name?.trim() || `${email.split('@')[0]} Company`;
  const baseSlug = slugify(companyName) || `company-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;
  while (await Company.exists({ slug })) slug = `${baseSlug}-${suffix++}`;
  return Company.create({ name: companyName, slug });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, age, gender, organizationName, organizationAddress, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400);
    throw new Error('Password and Confirm Password do not match');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    res.status(400);
    throw new Error(passwordValidation.message);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  // Force safe role assignment - regular registration always gets 'user'
  const company = await ensureCompany(req.body.companyName, normalizedEmail);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    age: age ? Number(age) : undefined,
    gender: gender || 'prefer-not-to-say',
    organizationName: organizationName?.trim() || '',
    organizationAddress: organizationAddress?.trim() || '',
    password,
    role: 'user',
    tenantId: company._id,
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, accountType } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Generic credential check to avoid leaking account existence
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account is inactive. Please contact support.');
  }
  if ((accountType === 'admin' && user.role !== 'admin') || (accountType === 'company' && user.role === 'admin')) {
    res.status(403);
    throw new Error('This account is not valid for the selected login type');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / Clear cookie
// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {},
  });
});

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// @desc    Update user profile
// @route   PATCH /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const fieldsToUpdate = {};
  if (name !== undefined) fieldsToUpdate.name = name.trim();
  if (avatar !== undefined) fieldsToUpdate.avatar = avatar;

  // Security check: Expressly forbid role or isActive updates through profile
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// @desc    Change user password
// @route   PATCH /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new passwords');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    res.status(400);
    throw new Error(passwordValidation.message);
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password request foundation
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide your email address');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Always return identical success response to prevent email enumeration
  res.status(200).json({
    success: true,
    message:
      'Password reset request received. (Note: Email delivery will be configured in a future integration phase).',
    data: {
      emailSent: false,
    },
  });
});

// @desc    Get Google OAuth authorization URL
// @route   GET /api/auth/google/url
export const getGoogleAuthUrl = asyncHandler(async (req, res) => {
  const clientId = process.env.GOOGLE_AUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5173/login';

  if (!clientId) {
    res.status(503);
    throw new Error('Google OAuth credentials are not configured on the server.');
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const qs = new URLSearchParams(options);
  const url = `${rootUrl}?${qs.toString()}`;

  res.status(200).json({
    success: true,
    data: { url },
  });
});

// @desc    Authenticate with Google authorization code or credential token
// @route   POST /api/auth/google
export const googleAuth = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const clientId = process.env.GOOGLE_AUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5173/login';

  if (!clientId || !clientSecret) {
    res.status(503);
    throw new Error('Google OAuth credentials are not configured on the server.');
  }

  if (!code) {
    res.status(400);
    throw new Error('Google authorization code is required.');
  }

  let googleUser = null;

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    const userinfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    googleUser = userinfoResponse.data;
  } catch (err) {
    res.status(400);
    throw new Error(`Google authentication failed: ${err.response?.data?.error_description || err.message}`);
  }

  const { sub: googleId, email, name, picture } = googleUser;

  if (!email) {
    res.status(400);
    throw new Error('Google account must provide an email address.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  let user = await User.findOne({
    $or: [{ googleId }, { email: normalizedEmail }],
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
    }
    if (picture && !user.avatar) {
      user.avatar = picture;
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    // Generate a secure random password for Google-created accounts
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const company = await ensureCompany(null, normalizedEmail);
    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      googleId,
      password: randomPassword,
      avatar: picture || '',
      role: 'user',
      tenantId: company._id,
    });
  }

  sendTokenResponse(user, 200, res);
});