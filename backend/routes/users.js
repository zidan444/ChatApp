import express from 'express';
import { protect } from '../middleware/auth.js';
import { getUsers, getUserById } from '../controllers/userController.js';
import { updateLastSeen } from "../controllers/userStatusController.js";

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.post("/last-seen", protect, updateLastSeen);

export default router;
