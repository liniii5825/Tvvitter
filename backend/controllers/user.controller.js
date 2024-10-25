import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const useToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      // toString() is used to compare the id as a string
      return res.status(400).json({ error: "You cannot follow yourself" });
    }
    if (!useToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      // Unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }); // Pull the user from currentUser's followers
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } }); // Pull the user from userToModify's following

      // Send notification to the user
      // TODO：Send notification to the user
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }); // Push the user to currentUser's followers
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } }); // Push the user to userToModify's following

      // Send notification to the user
      const newNotification = new Notification({
        from: req.user._id,
        to: useToModify.id,
        type: "follow",
      });
      // TODO: Send notification to the user
      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser: ", error.message);
    return res.status(500).json({ error: error.message });
  }
};
export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile: ", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const usersFollowingByMe = await User.findById(userId).select("following");

    // Get 10 users who are not me
    const users = await User.aggregate([
      // { $match: { _id: { $nin: usersFollowingByMe.following } } }, Better way
      { $match: { _id: { $ne: userId } } },
      { $sample: { size: 10 } },
    ]);
    // Filter out the users who are already followed by me
    const filteredUsers = users.filter(
      (user) => !usersFollowingByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4); // Get the first 4 users
    suggestedUsers.forEach((user) => (user.password = null)); // Remove the password from the user object
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers: ", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {};
