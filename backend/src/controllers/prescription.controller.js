// src/controllers/prescription.controller.js
const { supabaseAdmin } = require('../config/supabase');

// ─── POST /api/prescriptions ──────────────────────────────────
const addPrescription = async (req, res, next) => {
  try {
    const { patient_id, diagnosis, symptoms, medications, instructions, follow_up_date } = req.body;

    if (!patient_id || !diagnosis || !medications) {
      return res.status(400).json({ error: 'patient_id, diagnosis, and medications are required.' });
    }

    // Verify doctor has access to patient
    const { data: access } = await supabaseAdmin
      .from('doctor_patient_access')
      .select('id')
      .eq('doctor_id', req.user.id)
      .eq('patient_id', patient_id)
      .eq('status', 'approved')
      .single();

    if (!access) {
      return res.status(403).json({ error: 'No approved access to this patient.' });
    }

    // medications should be an array: [{name, dosage, frequency, duration, instructions}]
    const medsArray = Array.isArray(medications) ? medications : JSON.parse(medications);

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        patient_id,
        doctor_id: req.user.id,
        diagnosis,
        symptoms: symptoms || null,
        medications: medsArray,
        instructions: instructions || null,
        follow_up_date: follow_up_date || null,
      })
      .select(`
        *,
        doctor:doctor_id(full_name, doctor_profiles(specialization, hospital))
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Prescription added successfully.',
      prescription,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/prescriptions/my ────────────────────────────────
const getMyPrescriptions = async (req, res, next) => {
  try {
    const { data: prescriptions, error } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        doctor:doctor_id(full_name, doctor_profiles(specialization, hospital))
      `)
      .eq('patient_id', req.user.id)
      .order('prescribed_at', { ascending: false });

    if (error) throw error;

    res.json({ prescriptions });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/prescriptions/doctor/issued ─────────────────────
const getDoctorPrescriptions = async (req, res, next) => {
  try {
    const { data: prescriptions, error } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        patient:patient_id(full_name, email)
      `)
      .eq('doctor_id', req.user.id)
      .order('prescribed_at', { ascending: false });

    if (error) throw error;

    res.json({ prescriptions });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/prescriptions/:id ───────────────────────────────
const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        doctor:doctor_id(full_name, doctor_profiles(specialization, hospital, license_number)),
        patient:patient_id(full_name, email, date_of_birth)
      `)
      .eq('id', id)
      .single();

    if (!prescription) return res.status(404).json({ error: 'Prescription not found.' });

    // Access check
    if (
      req.user.role === 'patient' && prescription.patient_id !== req.user.id ||
      req.user.role === 'doctor' && prescription.doctor_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ prescription });
  } catch (err) {
    next(err);
  }
};

module.exports = { addPrescription, getMyPrescriptions, getDoctorPrescriptions, getPrescriptionById };
