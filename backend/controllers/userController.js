import User from '../models/user.js';

export const getUsers = async (req, res) => {
  const q = req.query.q || '';

  try {
    const users = await User.find({
      name: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id }, // exclude self
    }).select('name email avatarUrl lastSeen');

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
