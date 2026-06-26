// src/routes/sharing.routes.js
const express = require('express');
const router = express.Router();
const {
  shareRecord, revokeShare, getMyShares,
  requestAccess, approveAccess, getAccessRequests, getRecordQR
} = require('../controllers/sharing.controller');
const { authenticate, authorize, requireVerified } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/share-record',           authorize('patient'), shareRecord);
router.delete('/revoke/:shareId',      authorize('patient'), revokeShare);
router.get('/my-shares',               authorize('patient'), getMyShares);
router.post('/request-access',         authorize('doctor'), requireVerified, requestAccess);
router.put('/access/:requestId',       authorize('patient'), approveAccess);
router.get('/access-requests',         getAccessRequests);
router.get('/qr/:recordId',            authorize('patient'), getRecordQR);

module.exports = router;
