import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema, adminLoginSchema } from '../validators/auth';
import { authService } from '../services/auth';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}));

router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  // Set refresh token in httpOnly cookie
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.json(result);
}));

router.post('/admin/login', validateBody(adminLoginSchema), asyncHandler(async (req, res) => {
  const result = await authService.adminLogin(req.body);
  res.cookie('adminAccessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('adminRefreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json(result);
}));

router.post('/refresh', validateBody(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json(tokens);
}));

router.post('/admin/refresh', validateBody(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.adminRefreshToken(refreshToken);
  res.cookie('adminAccessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('adminRefreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json(tokens);
}));

router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json(result);
}));

router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ message: 'Password reset successfully' });
}));

// Protected routes
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  await authService.logout(req.user!.id);
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}));

router.post('/admin/logout', authMiddleware, asyncHandler(async (req, res) => {
  // Admin logout handled by admin middleware
  res.clearCookie('adminAccessToken');
  res.clearCookie('adminRefreshToken');
  res.json({ message: 'Admin logged out successfully' });
}));

router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user!.id);
  res.json(profile);
}));

router.patch('/profile', authMiddleware, validateBody(updateProfileSchema), asyncHandler(async (req, res) => {
  const profile = await authService.updateProfile(req.user!.id, req.body);
  res.json(profile);
}));

router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), asyncHandler(async (req, res) => {
  await authService.changePassword(req.user!.id, req.body);
  res.json({ message: 'Password changed successfully' });
}));

export default router;