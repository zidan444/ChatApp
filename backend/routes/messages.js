import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createMessage,
  getMessagesForChat,
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/', protect, createMessage);
router.get('/:chatId', protect, getMessagesForChat);

export default router;
