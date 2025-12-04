import express from 'express';
import { protect } from '../middleware/auth.js';
import { getUsers, getUserById,getMe, updateMe } from '../controllers/userController.js';
import { updateLastSeen } from "../controllers/userStatusController.js";

const router = express.Router();
 
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.post("/last-seen", protect, updateLastSeen);

export default router;
