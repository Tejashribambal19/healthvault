// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers, verifyDoctor, toggleUserStatus,
  getDashboardStats, getAuditLogs,
  getPatientOverview, getDoctorOverview,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Every route below requires a logged-in ADMIN. No doctor or patient
// token can reach any of these, even if they guess the URL.
router.use(authenticate, authorize('admin'));

router.get('/users',                    getAllUsers);
router.put('/verify-doctor/:userId',    verifyDoctor);
router.put('/toggle-user/:userId',      toggleUserStatus);
router.get('/stats',                    getDashboardStats);
router.get('/audit-logs',               getAuditLogs);

// Full oversight — admin can view ANY patient's records/prescriptions
// and ANY doctor's prescriptions/patient list, bypassing the normal
// sharing/access-grant rules that apply to doctors.
router.get('/patients/:id',             getPatientOverview);
router.get('/doctors/:id',              getDoctorOverview);

module.exports = router;
