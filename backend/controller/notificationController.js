import Notification from "../model/NotificationModel.js";

export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.userId });
    res.json({ success: true, message: "All notifications deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name photoUrl");

    const total = await Notification.countDocuments({ recipient: req.userId });
    const unread = await Notification.countDocuments({ recipient: req.userId, read: false });

    res.json({ notifications, total, unread, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "all") {
      await Notification.updateMany(
        { recipient: req.userId, read: false },
        { read: true }
      );
    } else {
      await Notification.findByIdAndUpdate(id, { read: true });
    }
    const unread = await Notification.countDocuments({ recipient: req.userId, read: false });
    res.json({ success: true, unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createNotification = async ({ recipient, type, title, titleAr, message, messageAr, link, actor, io, dedupKey }) => {
  try {
    let notification;
    let isUpdate = false;

    if (dedupKey) {
      const existing = await Notification.findOne({
        recipient,
        type,
        actor,
        ...dedupKey,
      }).sort({ createdAt: -1 });

      if (existing) {
        existing.message = message;
        existing.messageAr = messageAr || existing.messageAr;
        existing.title = title;
        existing.titleAr = titleAr || existing.titleAr;
        existing.link = link || existing.link;
        existing.read = false;
        existing.createdAt = new Date();
        await existing.save();
        notification = existing;
        isUpdate = true;
      }
    }

    if (!notification) {
      notification = await Notification.create({
        recipient,
        type,
        title,
        titleAr,
        message,
        messageAr,
        link,
        actor,
      });
    }

    const populated = await Notification.findById(notification._id)
      .populate("actor", "name photoUrl");

    const unread = await Notification.countDocuments({ recipient, read: false });

    if (io) {
      io.to(recipient.toString()).emit("newNotification", {
        notification: populated,
        unread,
      });
    }

    return populated;
  } catch (err) {
    console.error("createNotification error:", err);
  }
};
