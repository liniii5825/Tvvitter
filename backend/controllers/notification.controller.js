import Notifacation from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // `to: userId` means that the notification is for the current user
    // `path: 'from'` means that the notification contains the user who sent the notification
    // `select: 'username profileImg'` means that we only want to show the username and profileImg of the user who sent the notification
    const notifications = await Notifacation.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    // `updateMany()` means that we want to update all notifications for the current user to read
    await Notifacation.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in getNotifications: ", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notifacation.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotification: ", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notifacation.findById(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    if (notification.to.toString() !== userId.toString()) {
      // `notification.to` is the user who received the notification
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this notification" });
    }

    await Notifacation.findByIdAndDelete(id);

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotification: ", error.message);
    return res.status(500).json({ error: error.message });
  }
};
