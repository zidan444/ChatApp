import Chat from '../models/chat.js';

export const accessChat = async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    return res.status(400).json({ message: 'otherUserId required' });
  }

  try {
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [userId, otherUserId] },
    })
      .populate('participants', 'name email avatarUrl lastSeen')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name email avatarUrl' },
      });

    if (chat) {
      return res.json(chat);
    }

    const chatData = {
      participants: [userId, otherUserId],
      isGroup: false,
    };

    chat = await Chat.create(chatData);
    chat = await Chat.findById(chat._id).populate('participants', 'name email avatarUrl lastSeen');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Access chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getChatsForUser = async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email avatarUrl lastSeen')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name email avatarUrl' },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
