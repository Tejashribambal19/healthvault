// src/routes/prescription.routes.js
const express = require('express');
const router = express.Router();
const {
  addPrescription, getMyPrescriptions,
  getDoctorPrescriptions, getPrescriptionById
} = require('../controllers/prescription.controller');
const { authenticate, authorize, requireVerified } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',           authorize('doctor'), requireVerified, addPrescription);
router.get('/my',          authorize('patient'), getMyPrescriptions);
router.get('/issued',      authorize('doctor'),  getDoctorPrescriptions);
router.get('/:id',         getPrescriptionById);

module.exports = router;
