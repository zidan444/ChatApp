import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  accessChat,
  getChatsForUser,
  createGroupChat,
  removeFromGroup,
  renameGroup,
  addToGroup,
  updateMember,
  updateGroupAvatar,
  leaveGroup,
  deleteGroup,
  addAdminToGroup,
} from '../controllers/chatController.js';


const router = express.Router();

router.post('/access', protect, accessChat);
router.get('/', protect, getChatsForUser);
router.post('/group', protect, createGroupChat);
router.put('/group/rename', protect, renameGroup);
router.put('/group/remove-user', protect, removeFromGroup);
router.put('/group/add-user', protect, addToGroup);
router.put('/group/avatar', protect, updateGroupAvatar);
router.post('/group/leave', protect, leaveGroup);
router.delete('/group/:chatId', protect, deleteGroup);
router.put('/group/:chatId', protect, updateMember);
router.put('/group/add-admin', protect, addAdminToGroup);

export default router;
