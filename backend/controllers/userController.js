import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
  const q = req.query.q || '';

  try {
    const users = await User.find({
      name: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id },
    }).select('name email avatar lastSeen');

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
  
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword,avatar } = req.body;

   
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar){
      user.avatar = avatar
    }

    // handle password change
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Both current and new password are required"
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
   
    const updatedUser = await User.findById(user._id).select("-password");
    res.json(updatedUser);

  } catch (err) {
    console.error("updateMe error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
