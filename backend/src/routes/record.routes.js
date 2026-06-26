// src/routes/record.routes.js
const express = require('express');
const router = express.Router();
const {
  uploadRecord, getMyRecords, getPatientRecords,
  getRecordById, deleteRecord, getEmergencyRecords
} = require('../controllers/record.controller');
const { authenticate, authorize, requireVerified } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/error.middleware');
const upload = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

router.post('/upload',
  authorize('patient', 'doctor'),
  requireVerified,
  upload.single('file'),
  auditLog('upload_record', 'medical_records'),
  uploadRecord
);

router.get('/',
  authorize('patient'),
  getMyRecords
);

router.get('/patient/:patientId',
  authorize('doctor', 'admin'),
  requireVerified,
  auditLog('view_patient_records', 'medical_records'),
  getPatientRecords
);

router.get('/emergency/:patientId',
  getEmergencyRecords  // No role restriction — emergency access
);

router.get('/:id',
  auditLog('view_record', 'medical_records'),
  getRecordById
);

router.delete('/:id',
  authorize('patient', 'admin'),
  deleteRecord
);

module.exports = router;
