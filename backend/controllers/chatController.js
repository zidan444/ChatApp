import Chat from "../models/chat.js";
import Message from "../models/message.js";

// 1-1 chat
export const accessChat = async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    return res.status(400).json({ message: "otherUserId required" });
  }

  try {
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [userId, otherUserId] },
    })
      .populate("participants", "name email avatar lastSeen")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    if (chat) {
      return res.json(chat);
    }

    const chatData = {
      participants: [userId, otherUserId],
      isGroup: false,
    };

    chat = await Chat.create(chatData);
    chat = await Chat.findById(chat._id).populate(
      "participants",
      "name email avatar lastSeen"
    );

    res.status(201).json(chat);
  } catch (error) {
    console.error("Access chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// all chats for logged-in user
export const getChatsForUser = async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE GROUP
export const createGroupChat = async (req, res) => {
  try {
    let { name, users } = req.body;

    // if frontend / Postman sends users as JSON string, parse it
    if (typeof users === "string") {
      try {
        users = JSON.parse(users);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "users must be an array or JSON string array" });
      }
    }

    if (!name || !users || !Array.isArray(users) || users.length < 2) {
      return res.status(400).json({
        message: "Group requires name and at least 2 users",
      });
    }

    // ensure logged-in user is in the group
    const loggedInId = req.user._id.toString();
    const uniqueUsers = [...users.map((u) => u.toString())];

    if (!uniqueUsers.includes(loggedInId)) {
      uniqueUsers.push(loggedInId);
    }

    const groupChat = await Chat.create({
      groupAdmin: req.user._id,
      admins: [],
      participants: uniqueUsers,
      name,
      isGroup: true,
    });

    const fullChat = await Chat.findById(groupChat._id)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    return res.status(201).json(fullChat);
  } catch (error) {
    console.error("Create group chat error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// RENAME GROUP
export const renameGroup = async (req, res) => {
  const { chatId, name } = req.body;

  if (!chatId || !name) {
    return res.status(400).json({ message: "chatId and name are required" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const requester = req.user._id.toString();
    const isAdmin =
      chat.groupAdmin?.toString() === requester ||
      (chat.admins || []).map((x) => x.toString()).includes(requester);
    if (!isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    chat.name = name;
    await chat.save();

    const updated = await Chat.findById(chatId)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    res.json(updated);
  } catch (error) {
    console.error("Rename group error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD USER TO GROUP
export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const requester = req.user._id.toString();
    const isAdmin =
      chat.groupAdmin?.toString() === requester ||
      (chat.admins || []).map((x) => x.toString()).includes(requester);
    if (!isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chat.participants.map((id) => id.toString()).includes(userId)) {
      chat.participants.push(userId);
      await chat.save();
    }

    const fullChat = await Chat.findById(chatId)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    res.json(fullChat);
  } catch (error) {
    console.error("Add to group error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// REMOVE USER FROM GROUP
export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const requester = req.user._id.toString();
    const isAdmin =
      chat.groupAdmin?.toString() === requester ||
      (chat.admins || []).map((x) => x.toString()).includes(requester);
    if (!isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    chat.participants = chat.participants.filter(
      (id) => id.toString() !== userId
    );
    await chat.save();

    const updated = await Chat.findById(chatId)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    res.json(updated);
  } catch (error) {
    console.error("Remove from group error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMember = async (req, res) => {
  const { chatId } = req.params;
  let { users } = req.body; // 'users' should be an array of user IDs

  if (!chatId || !users || !Array.isArray(users) || users.length < 2) {
    return res.status(400).json({
      message: "Chat ID and an array of at least 2 user IDs are required.",
    });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    // 1. Basic Validation
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // 2. Admin Check
    const requester = req.user._id.toString();
    const isAdmin =
      chat.groupAdmin?.toString() === requester ||
      (chat.admins || []).map((x) => x.toString()).includes(requester);
    if (!isAdmin) {
      return res.status(401).json({ message: "Only admins can update members" });
    }
    
    // 3. Update the Participants Array
    // Find the chat and update the entire participants array in one go
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        participants: users, // Replace the entire array with the new list
      },
      { new: true } // Return the updated document
    )
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });

    if (!updatedChat) {
      return res.status(404).json({ message: "Failed to find and update chat" });
    }

    res.json(updatedChat);
  } catch (error) {
    console.error("Update group members error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateGroupAvatar = async (req, res) => {
  const { chatId, avatar } = req.body;
  if (!chatId || typeof avatar !== "string") {
    return res.status(400).json({ message: "chatId and avatar are required" });
  }
  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }
    const requester = req.user._id.toString();
    const isAdmin =
      chat.groupAdmin?.toString() === requester ||
      (chat.admins || []).map((x) => x.toString()).includes(requester);
    if (!isAdmin) {
      return res.status(401).json({ message: "Only admins can update avatar" });
    }
    chat.avatar = avatar;
    await chat.save();
    const updated = await Chat.findById(chatId)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });
    return res.json(updated);
  } catch (error) {
    console.error("Update group avatar error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const leaveGroup = async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }
  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }
    const userId = req.user._id.toString();
    chat.participants = chat.participants.filter((id) => id.toString() !== userId);
    // if admin left, reassign to first remaining participant if any
    if (chat.groupAdmin && chat.groupAdmin.toString() === userId) {
      const first = chat.participants[0] || null;
      chat.groupAdmin = first || undefined;
    }
    if (Array.isArray(chat.admins) && chat.admins.length) {
      chat.admins = chat.admins.filter((x) => x.toString() !== userId);
    }
    if (chat.participants.length === 0) {
      await Message.deleteMany({ chat: chat._id });
      await Chat.findByIdAndDelete(chat._id);
      return res.json({ message: "Group deleted as last member left", chatId });
    }
    await chat.save();
    const updated = await Chat.findById(chatId)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });
    return res.json(updated);
  } catch (error) {
    console.error("Leave group error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteGroup = async (req, res) => {
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }
  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Only admin can delete group" });
    }
    await Message.deleteMany({ chat: chat._id });
    await Chat.findByIdAndDelete(chat._id);
    return res.json({ message: "Group deleted", chatId });
  } catch (error) {
    console.error("Delete group error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const addAdminToGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }
  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }
    const requester = req.user._id.toString();
    const isAdmin =
      chat.groupAdmin?.toString() === requester ||
      (chat.admins || []).map((x) => x.toString()).includes(requester);
    if (!isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const uid = userId.toString();
    const isParticipant = chat.participants.map((x) => x.toString()).includes(uid);
    if (!isParticipant) {
      return res.status(400).json({ message: "User must be a group member" });
    }
    const alreadyPrimary = chat.groupAdmin?.toString() === uid;
    const isAlreadyAdmin = (chat.admins || []).map((x) => x.toString()).includes(uid);
    if (!alreadyPrimary && !isAlreadyAdmin) {
      chat.admins = [...(chat.admins || []), userId];
      await chat.save();
    }
    const updated = await Chat.findById(chatId)
      .populate("participants", "name email avatar lastSeen")
      .populate("groupAdmin", "name email avatar")
      .populate("admins", "name email avatar")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email avatar" },
      });
    return res.json(updated);
  } catch (error) {
    console.error("Add admin to group error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
