// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { supabaseAdmin } = require('../config/supabase');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);

// GET /api/users/doctors — list verified doctors
router.get('/doctors', async (req, res, next) => {
  try {
    const { specialization, search } = req.query;
    let query = supabaseAdmin
      .from('users')
      .select(`id, full_name, email, profile_pic,
        doctor_profiles(specialization, hospital, experience_years, bio, consultation_fee)`)
      .eq('role', 'doctor')
      .eq('is_verified', true)
      .eq('is_active', true);

    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data: doctors, error } = await query;
    if (error) throw error;

    const filtered = specialization
      ? doctors.filter(d => d.doctor_profiles?.specialization?.toLowerCase().includes(specialization.toLowerCase()))
      : doctors;

    res.json({ doctors: filtered });
  } catch (err) { next(err); }
});

// GET /api/users/my-doctors — patients: list doctors with access
router.get('/my-doctors', authorize('patient'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctor_patient_access')
      .select(`status, granted_at,
        doctor:doctor_id(id, full_name, email,
          doctor_profiles(specialization, hospital))`)
      .eq('patient_id', req.user.id)
      .eq('status', 'approved');

    if (error) throw error;
    res.json({ doctors: data });
  } catch (err) { next(err); }
});

// GET /api/users/my-patients — doctors: list patients
router.get('/my-patients', authorize('doctor'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('doctor_patient_access')
      .select(`status, granted_at,
        patient:patient_id(id, full_name, email, date_of_birth,
          patient_profiles(blood_group, allergies, chronic_conditions))`)
      .eq('doctor_id', req.user.id)
      .eq('status', 'approved');

    if (error) throw error;
    res.json({ patients: data });
  } catch (err) { next(err); }
});

// PUT /api/users/profile — update profile
router.put('/profile', async (req, res, next) => {
  try {
    const allowed = ['full_name', 'phone', 'date_of_birth', 'gender', 'address'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const { data, error } = await supabaseAdmin
      .from('users').update(updates).eq('id', req.user.id).select().single();

    if (error) throw error;

    // Update role-specific profile
    if (req.user.role === 'doctor') {
      const dpFields = ['specialization', 'hospital', 'experience_years', 'bio', 'consultation_fee'];
      const dpUpdates = {};
      dpFields.forEach(k => { if (req.body[k] !== undefined) dpUpdates[k] = req.body[k]; });
      if (Object.keys(dpUpdates).length > 0) {
        await supabaseAdmin.from('doctor_profiles').update(dpUpdates).eq('user_id', req.user.id);
      }
    } else if (req.user.role === 'patient') {
      const ppFields = ['blood_group', 'allergies', 'chronic_conditions', 'emergency_contact_name', 'emergency_contact_phone', 'insurance_provider', 'insurance_id'];
      const ppUpdates = {};
      ppFields.forEach(k => { if (req.body[k] !== undefined) ppUpdates[k] = req.body[k]; });
      if (Object.keys(ppUpdates).length > 0) {
        await supabaseAdmin.from('patient_profiles').update(ppUpdates).eq('user_id', req.user.id);
      }
    }

    res.json({ message: 'Profile updated.', user: data });
  } catch (err) { next(err); }
});

module.exports = router;
