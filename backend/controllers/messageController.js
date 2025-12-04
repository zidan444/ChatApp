import Message from '../models/message.js';
import Chat from '../models/chat.js';

export const createMessage = async (req, res) => {
  const { chatId, content, attachments } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'chatId is required' });
  }

  try {
    const message = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content,
      attachments,
    });

    const fullMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate({
        path: 'chat',
        populate: { path: 'participants', select: 'name email avatar' },
      });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: fullMessage._id,
      updatedAt: Date.now(),
    });

    const io = req.app.get('io');
    if (io && fullMessage.chat && fullMessage.chat.participants) {
      fullMessage.chat.participants.forEach((participant) => {
        const id = participant._id.toString();
        io.to(id).emit('messageReceived', fullMessage);
      });
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessagesForChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
