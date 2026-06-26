// src/controllers/admin.controller.js
const { supabaseAdmin } = require('../config/supabase');

// ─── GET /api/admin/users ─────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { role, is_verified, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, role, full_name, phone, is_active, is_verified, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (role) query = query.eq('role', role);
    if (is_verified !== undefined) query = query.eq('is_verified', is_verified === 'true');
    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data: users, error, count } = await query;
    if (error) throw error;

    res.json({ users, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/verify-doctor/:userId ─────────────────────
const verifyDoctor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('id', userId)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role !== 'doctor') return res.status(400).json({ error: 'User is not a doctor.' });

    await supabaseAdmin
      .from('users')
      .update({ is_verified: action === 'approve' })
      .eq('id', userId);

    res.json({ message: `Doctor ${user.full_name} ${action === 'approve' ? 'verified' : 'rejected'}.` });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/toggle-user/:userId ───────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account.' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, is_active, full_name')
      .eq('id', userId)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found.' });

    await supabaseAdmin
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', userId);

    res.json({ message: `${user.full_name} ${user.is_active ? 'deactivated' : 'activated'}.` });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/stats ─────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      { count: totalPatients },
      { count: totalDoctors },
      { count: pendingDoctors },
      { count: totalRecords },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'doctor').eq('is_verified', false),
      supabaseAdmin.from('medical_records').select('*', { count: 'exact', head: true }),
    ]);

    res.json({
      stats: { totalPatients, totalDoctors, pendingDoctors, totalRecords }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/audit-logs ────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select(`*, user:user_id(full_name, email, role)`)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/patients/:id ───────────────────────────────
// Admin-only full oversight: this BYPASSES doctor_patient_access /
// record_shares checks entirely — admin sees every record and every
// prescription for this patient, regardless of who it's shared with.
const getPatientOverview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: patient, error: userErr } = await supabaseAdmin
      .from('users')
      .select(`id, email, full_name, phone, date_of_birth, gender, is_active, created_at,
        patient_profiles(blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone)`)
      .eq('id', id)
      .eq('role', 'patient')
      .single();

    if (userErr || !patient) return res.status(404).json({ error: 'Patient not found.' });

    const [{ data: records }, { data: prescriptions }, { data: shares }] = await Promise.all([
      supabaseAdmin.from('medical_records').select('*').eq('patient_id', id).order('record_date', { ascending: false }),
      supabaseAdmin.from('prescriptions').select(`*, doctor:doctor_id(full_name, doctor_profiles(specialization, hospital))`).eq('patient_id', id).order('prescribed_at', { ascending: false }),
      supabaseAdmin.from('record_shares').select(`*, doctor:doctor_id(full_name)`).eq('patient_id', id),
    ]);

    res.json({ patient, records, prescriptions, shares });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/doctors/:id ────────────────────────────────
// Admin-only full oversight of a doctor: profile + everything they've
// prescribed + every patient they currently have access to.
const getDoctorOverview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: doctor, error: userErr } = await supabaseAdmin
      .from('users')
      .select(`id, email, full_name, phone, is_active, is_verified, created_at,
        doctor_profiles(license_number, specialization, hospital, experience_years, bio)`)
      .eq('id', id)
      .eq('role', 'doctor')
      .single();

    if (userErr || !doctor) return res.status(404).json({ error: 'Doctor not found.' });

    const [{ data: prescriptions }, { data: patients }] = await Promise.all([
      supabaseAdmin.from('prescriptions').select(`*, patient:patient_id(full_name, email)`).eq('doctor_id', id).order('prescribed_at', { ascending: false }),
      supabaseAdmin.from('doctor_patient_access').select(`*, patient:patient_id(full_name, email)`).eq('doctor_id', id).eq('status', 'approved'),
    ]);

    res.json({ doctor, prescriptions, patients });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers, verifyDoctor, toggleUserStatus, getDashboardStats, getAuditLogs,
  getPatientOverview, getDoctorOverview,
};
