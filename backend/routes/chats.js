import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  accessChat,
  getChatsForUser,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/access', protect, accessChat);
router.get('/', protect, getChatsForUser);

export default router;
