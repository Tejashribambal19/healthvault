// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { supabaseAdmin } = require('../config/supabase');

// ─── Helper: Generate JWT ─────────────────────────────────────
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── POST /api/auth/register ──────────────────────────────────
const register = async (req, res, next) => {
  try {
    const {
      email, password, full_name, role,
      phone, date_of_birth, gender,
      // Doctor-specific
      license_number, specialization, hospital,
      // Patient-specific
      blood_group, allergies, emergency_contact_name, emergency_contact_phone
    } = req.body;

    // Validation
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'email, password, full_name, and role are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ error: 'Role must be doctor or patient.' });
    }
    if (role === 'doctor' && (!license_number || !specialization)) {
      return res.status(400).json({ error: 'Doctors must provide license_number and specialization.' });
    }

    // Check if email exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        role,
        full_name,
        phone: phone || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        is_verified: role === 'patient', // patients auto-verified, doctors need admin approval
      })
      .select('id, email, role, full_name, is_verified')
      .single();

    if (userError) throw userError;

    // Create role-specific profile
    if (role === 'doctor') {
      const { error: dpError } = await supabaseAdmin
        .from('doctor_profiles')
        .insert({
          user_id: user.id,
          license_number,
          specialization,
          hospital: hospital || null,
        });
      if (dpError) throw dpError;
    } else if (role === 'patient') {
      const { error: ppError } = await supabaseAdmin
        .from('patient_profiles')
        .insert({
          user_id: user.id,
          blood_group: blood_group || null,
          allergies: allergies || [],
          emergency_contact_name: emergency_contact_name || null,
          emergency_contact_phone: emergency_contact_phone || null,
        });
      if (ppError) throw ppError;
    }

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: role === 'doctor'
        ? 'Doctor registered successfully. Awaiting admin verification.'
        : 'Patient registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        is_verified: user.is_verified,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Fetch user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, full_name, is_active, is_verified, profile_pic')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated. Contact admin.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        is_verified: user.is_verified,
        profile_pic: user.profile_pic,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, role, full_name, phone, date_of_birth, gender,
        address, profile_pic, is_verified, created_at,
        doctor_profiles (license_number, specialization, hospital, experience_years, bio),
        patient_profiles (blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone)
      `)
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/auth/change-password ────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', req.user.id);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
