import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  // In a real app with refresh tokens, we would invalidate the refresh token in the DB
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        department,
      },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name, role, department, isActive, password } = req.body;
    
    let updateData: any = { name, role, department, isActive };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid current password' });
    
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
