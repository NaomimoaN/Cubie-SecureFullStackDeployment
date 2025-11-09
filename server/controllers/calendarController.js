import CalendarEvent from "../models/calendarModel.js";
import { sendCalendarNotification } from "../utils/notificationHelper.js";

// 全イベントの取得
export const getAllEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.findActive();

    console.log("Calendar API - All events fetched:", events.length);
    console.log(
      "Calendar API - Events with hiddenForParents:",
      events.map((event) => ({
        title: event.title,
        hiddenForParents: event.hiddenForParents,
      }))
    );

    res.json({
      success: true,
      data: events,
      message: "Events retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// 特定のイベントの取得
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await CalendarEvent.findById(id)
      .populate("createdBy", "name email")
      .populate("subject", "name");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
      message: "Event retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

// 新しいイベントの作成
export const createEvent = async (req, res) => {
  try {
    console.log("=== Calendar Event Creation ===");
    console.log("User:", req.user);
    console.log("Request body:", req.body);

    // Teacherのみ作成可能
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      console.log("Permission denied: User role is", req.user.role);
      return res.status(403).json({
        success: false,
        message: "Only teachers can create events",
      });
    }

    const {
      title,
      description,
      start,
      end,
      allDay,
      category,
      repeat,
      subject = null,
      targetAudience = null,
      hiddenForParents = false,
    } = req.body;

    // バリデーション
    console.log("Validating input...");
    console.log("Title:", title);
    console.log("Start:", start);
    console.log("End:", end);
    console.log("Hidden for parents:", hiddenForParents);

    if (!title || !start || !end) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      });
    }

    if (new Date(start) > new Date(end)) {
      console.log(
        "Validation failed: End date must be after or equal to start date"
      );
      return res.status(400).json({
        success: false,
        message: "End date must be after or equal to start date",
      });
    }

    const newEvent = new CalendarEvent({
      title,
      description,
      start,
      end,
      allDay: allDay || false,
      category: category || "other",
      repeat: repeat || "none",
      createdBy: req.user._id,
      subject,
      targetAudience: targetAudience || "all",
      hiddenForParents: hiddenForParents || false,
    });

    const savedEvent = await newEvent.save();
    const populatedEvent = await CalendarEvent.findById(savedEvent._id)
      .populate("createdBy", "name email")
      .populate("subject", "name");

    // Send notification to users about the new calendar event
    try {
      await sendCalendarNotification(populatedEvent, "created");
      console.log("Calendar notification sent successfully");
    } catch (notificationError) {
      console.error("Failed to send calendar notification:", notificationError);
      // Don't fail the main request if notification fails
    }

    res.status(201).json({
      success: true,
      data: populatedEvent,
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
};

// イベントの更新
export const updateEvent = async (req, res) => {
  try {
    // Teacherのみ更新可能
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can update events",
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // バリデーション
    if (updateData.start && updateData.end) {
      if (new Date(updateData.start) > new Date(updateData.end)) {
        return res.status(400).json({
          success: false,
          message: "End date must be after or equal to start date",
        });
      }
    }

    const event = await CalendarEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // 作成者のみ更新可能（管理者は除く）
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update events you created",
      });
    }

    const updatedEvent = await CalendarEvent.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email")
      .populate("subject", "name");

    // Send notification to users about the updated calendar event
    try {
      await sendCalendarNotification(updatedEvent, "updated");
      console.log("Calendar update notification sent successfully");
    } catch (notificationError) {
      console.error(
        "Failed to send calendar update notification:",
        notificationError
      );
      // Don't fail the main request if notification fails
    }

    res.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

// イベントの削除
export const deleteEvent = async (req, res) => {
  try {
    // Teacherのみ削除可能
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can delete events",
      });
    }

    const { id } = req.params;

    const event = await CalendarEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // 作成者のみ削除可能（管理者は除く）
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete events you created",
      });
    }

    await CalendarEvent.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

// 日付範囲内のイベントを取得
export const getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const events = await CalendarEvent.findByDateRange(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: events,
      message: "Events retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching events by date range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// カテゴリ別のイベントを取得
export const getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const events = await CalendarEvent.findByCategory(category);

    res.json({
      success: true,
      data: events,
      message: "Events retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching events by category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// 親向けの非表示設定を更新
export const toggleEventVisibilityForParents = async (req, res) => {
  try {
    // Teacherのみ更新可能
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can update event visibility",
      });
    }

    const { id } = req.params;
    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // 作成者のみ更新可能（管理者は除く）
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update events you created",
      });
    }

    // 非表示設定を切り替え
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      id,
      { hiddenForParents: !event.hiddenForParents },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("subject", "name");

    res.json({
      success: true,
      data: updatedEvent,
      message: `Event ${
        updatedEvent.hiddenForParents ? "hidden" : "shown"
      } for parents successfully`,
    });
  } catch (error) {
    console.error("Error toggling event visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle event visibility",
      error: error.message,
    });
  }
};
