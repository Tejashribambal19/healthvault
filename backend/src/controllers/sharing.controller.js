// src/controllers/sharing.controller.js
const { supabaseAdmin } = require('../config/supabase');
const QRCode = require('qrcode');

// ─── POST /api/sharing/share-record ──────────────────────────
const shareRecord = async (req, res, next) => {
  try {
    const { record_id, doctor_id, access_type = 'read', expires_at } = req.body;

    if (!record_id || !doctor_id) {
      return res.status(400).json({ error: 'record_id and doctor_id are required.' });
    }

    // Verify the record belongs to the patient
    const { data: record } = await supabaseAdmin
      .from('medical_records')
      .select('id, patient_id, title')
      .eq('id', record_id)
      .single();

    if (!record) return res.status(404).json({ error: 'Record not found.' });
    if (record.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only share your own records.' });
    }

    // Verify the doctor exists and is verified
    const { data: doctor } = await supabaseAdmin
      .from('users')
      .select('id, full_name, is_verified')
      .eq('id', doctor_id)
      .eq('role', 'doctor')
      .single();

    if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });
    if (!doctor.is_verified) {
      return res.status(400).json({ error: 'Doctor is not yet verified.' });
    }

    // Upsert share
    const { data: share, error } = await supabaseAdmin
      .from('record_shares')
      .upsert({
        record_id,
        patient_id: req.user.id,
        doctor_id,
        access_type,
        expires_at: expires_at || null,
        is_active: true,
      }, { onConflict: 'record_id,doctor_id' })
      .select()
      .single();

    if (error) throw error;

    // Update record to mark as shared
    await supabaseAdmin
      .from('medical_records')
      .update({ is_shared: true })
      .eq('id', record_id);

    res.status(201).json({
      message: `Record "${record.title}" shared with Dr. ${doctor.full_name}.`,
      share,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/sharing/revoke/:shareId ──────────────────────
const revokeShare = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const { data: share } = await supabaseAdmin
      .from('record_shares')
      .select('*, medical_records(patient_id)')
      .eq('id', shareId)
      .single();

    if (!share) return res.status(404).json({ error: 'Share not found.' });
    if (share.medical_records.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the patient can revoke shares.' });
    }

    await supabaseAdmin
      .from('record_shares')
      .update({ is_active: false })
      .eq('id', shareId);

    res.json({ message: 'Share access revoked.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/sharing/my-shares ───────────────────────────────
const getMyShares = async (req, res, next) => {
  try {
    const { data: shares, error } = await supabaseAdmin
      .from('record_shares')
      .select(`
        id, access_type, expires_at, is_active, shared_at,
        record:record_id(id, title, category, record_date),
        doctor:doctor_id(id, full_name, doctor_profiles(specialization))
      `)
      .eq('patient_id', req.user.id)
      .order('shared_at', { ascending: false });

    if (error) throw error;

    res.json({ shares });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/sharing/request-access ────────────────────────
// Doctor requests access to patient
const requestAccess = async (req, res, next) => {
  try {
    const { patient_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required.' });
    }

    const { data: patient } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('id', patient_id)
      .eq('role', 'patient')
      .single();

    if (!patient) return res.status(404).json({ error: 'Patient not found.' });

    const { data: existing } = await supabaseAdmin
      .from('doctor_patient_access')
      .select('id, status')
      .eq('doctor_id', req.user.id)
      .eq('patient_id', patient_id)
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return res.status(400).json({ error: 'Already have access to this patient.' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Access request already pending.' });
      }
    }

    const { data: request, error } = await supabaseAdmin
      .from('doctor_patient_access')
      .upsert({
        doctor_id: req.user.id,
        patient_id,
        status: 'pending',
      }, { onConflict: 'doctor_id,patient_id' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: `Access request sent to ${patient.full_name}.`,
      request,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/sharing/access/:requestId/approve ──────────────
const approveAccess = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'revoke'

    const { data: accessReq } = await supabaseAdmin
      .from('doctor_patient_access')
      .select('id, patient_id, doctor_id')
      .eq('id', requestId)
      .single();

    if (!accessReq) return res.status(404).json({ error: 'Access request not found.' });
    if (accessReq.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the patient can manage access.' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'revoked';

    await supabaseAdmin
      .from('doctor_patient_access')
      .update({ status: newStatus, granted_by: req.user.id })
      .eq('id', requestId);

    res.json({ message: `Access ${newStatus} successfully.` });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/sharing/access-requests ────────────────────────
const getAccessRequests = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'patient') {
      query = supabaseAdmin
        .from('doctor_patient_access')
        .select(`id, status, granted_at,
          doctor:doctor_id(id, full_name, doctor_profiles(specialization, hospital))`)
        .eq('patient_id', req.user.id)
        .eq('status', 'pending');
    } else if (req.user.role === 'doctor') {
      query = supabaseAdmin
        .from('doctor_patient_access')
        .select(`id, status, granted_at,
          patient:patient_id(id, full_name, email)`)
        .eq('doctor_id', req.user.id);
    }

    const { data: requests, error } = await query;
    if (error) throw error;

    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/sharing/qr/:recordId ───────────────────────────
const getRecordQR = async (req, res, next) => {
  try {
    const { recordId } = req.params;

    const { data: record } = await supabaseAdmin
      .from('medical_records')
      .select('id, title, patient_id, qr_code')
      .eq('id', recordId)
      .single();

    if (!record) return res.status(404).json({ error: 'Record not found.' });
    if (record.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ qr_code: record.qr_code, record_title: record.title });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  shareRecord, revokeShare, getMyShares,
  requestAccess, approveAccess, getAccessRequests,
  getRecordQR
};
