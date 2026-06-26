// src/controllers/record.controller.js
const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// ─── Helper: Upload file to Supabase Storage ──────────────────
const uploadToStorage = async (file, patientId) => {
  const ext = file.originalname.split('.').pop();
  const fileName = `${patientId}/${uuidv4()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'medical-records')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabaseAdmin.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'medical-records')
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl, fileName };
};

// ─── Helper: Smart Categorize Tags ────────────────────────────
const autoTagRecord = (title, description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];

  const tagMap = {
    blood: ['blood', 'cbc', 'hemoglobin', 'platelet'],
    cardiac: ['ecg', 'echocardiogram', 'heart', 'cardiac', 'ekg'],
    radiology: ['xray', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'sonography'],
    diabetes: ['glucose', 'diabetes', 'hba1c', 'insulin', 'sugar'],
    liver: ['liver', 'hepatic', 'bilirubin', 'sgpt', 'sgot'],
    kidney: ['kidney', 'renal', 'creatinine', 'urine'],
    thyroid: ['thyroid', 'tsh', 't3', 't4'],
    covid: ['covid', 'corona', 'rtpcr', 'antigen'],
    vaccination: ['vaccine', 'vaccination', 'immunization'],
  };

  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(k => text.includes(k))) tags.push(tag);
  }

  return tags;
};

// ─── POST /api/records/upload ─────────────────────────────────
const uploadRecord = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { title, category, description, record_date, patient_id, emergency_access } = req.body;

    if (!title || !category || !record_date) {
      return res.status(400).json({ error: 'title, category, and record_date are required.' });
    }

    // Determine patient ID
    let targetPatientId = req.user.id;
    if (req.user.role === 'doctor' && patient_id) {
      // Doctor uploading for a patient — verify access
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
      targetPatientId = patient_id;
    } else if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients and doctors can upload records.' });
    }

    // Upload file
    const { url: file_url, fileName: file_name } = await uploadToStorage(req.file, targetPatientId);

    // Auto-generate tags
    const tags = autoTagRecord(title, description);

    // Generate QR code for sharing
    const shareUrl = `${process.env.FRONTEND_URL}/share/record/${uuidv4()}`;
    const qr_code = await QRCode.toDataURL(shareUrl);

    // Save record
    const { data: record, error } = await supabaseAdmin
      .from('medical_records')
      .insert({
        patient_id: targetPatientId,
        uploaded_by: req.user.id,
        title,
        category,
        description: description || null,
        file_url,
        file_name,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        tags,
        record_date,
        emergency_access: emergency_access === 'true',
        qr_code,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Medical record uploaded successfully.',
      record,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/records (My records) ───────────────────────────
const getMyRecords = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('medical_records')
      .select('*', { count: 'exact' })
      .eq('patient_id', req.user.id)
      .order('record_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data: records, error, count } = await query;
    if (error) throw error;

    res.json({
      records,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/records/patient/:patientId (Doctor views patient) ─
const getPatientRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check doctor has access to this patient
    if (req.user.role === 'doctor') {
      const { data: access } = await supabaseAdmin
        .from('doctor_patient_access')
        .select('id')
        .eq('doctor_id', req.user.id)
        .eq('patient_id', patientId)
        .eq('status', 'approved')
        .single();

      if (!access) {
        return res.status(403).json({ error: 'No approved access to this patient records.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { data: records, error } = await supabaseAdmin
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false });

    if (error) throw error;

    res.json({ records });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/records/:id ─────────────────────────────────────
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: record, error } = await supabaseAdmin
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !record) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    // Authorization check
    if (req.user.role === 'patient' && record.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.user.role === 'doctor') {
      // Check shared or patient access
      const { data: share } = await supabaseAdmin
        .from('record_shares')
        .select('id')
        .eq('record_id', id)
        .eq('doctor_id', req.user.id)
        .eq('is_active', true)
        .single();

      if (!share) {
        return res.status(403).json({ error: 'This record has not been shared with you.' });
      }
    }

    res.json({ record });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/records/:id ──────────────────────────────────
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: record } = await supabaseAdmin
      .from('medical_records')
      .select('patient_id, file_url, file_name')
      .eq('id', id)
      .single();

    if (!record) return res.status(404).json({ error: 'Record not found.' });

    if (record.patient_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the patient or admin can delete this record.' });
    }

    // Delete from storage
    await supabaseAdmin.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'medical-records')
      .remove([record.file_name]);

    // Delete DB record
    await supabaseAdmin.from('medical_records').delete().eq('id', id);

    res.json({ message: 'Record deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/records/emergency/:patientId ────────────────────
const getEmergencyRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const { data: records, error } = await supabaseAdmin
      .from('medical_records')
      .select('id, title, category, record_date, file_url, tags')
      .eq('patient_id', patientId)
      .eq('emergency_access', true)
      .order('record_date', { ascending: false });

    if (error) throw error;

    // Also fetch basic patient info
    const { data: patientProfile } = await supabaseAdmin
      .from('users')
      .select(`full_name, date_of_birth, blood_group,
        patient_profiles(blood_group, allergies, emergency_contact_name, emergency_contact_phone)`)
      .eq('id', patientId)
      .single();

    res.json({ emergency_records: records, patient_info: patientProfile });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadRecord,
  getMyRecords,
  getPatientRecords,
  getRecordById,
  deleteRecord,
  getEmergencyRecords,
};
