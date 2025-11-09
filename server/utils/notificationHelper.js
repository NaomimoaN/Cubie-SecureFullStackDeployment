import User from "../models/userModel.js";
import axios from "axios";

// Function to send notifications to users based on their preferences
export const sendNotificationToUsers = async (notificationData) => {
  const { type, title, message, targetAudience = "all", metadata = {} } = notificationData;
  
  console.log("🔔 sendNotificationToUsers called with:", { type, title, message, targetAudience });
  
  try {
    // Build user query based on target audience
    let userQuery = {};
    
    if (targetAudience === "teachers") {
      userQuery.role = "teacher";
    } else if (targetAudience === "students") {
      userQuery.role = "student";
    } else if (targetAudience === "parents") {
      userQuery.role = "parent";
    }
    // If targetAudience is "all", query remains empty (gets all users)
    
    console.log("🔍 Finding users with query:", userQuery);
    
    // Find users and check their notification preferences
    const users = await User.find(userQuery);
    console.log(`Found ${users.length} users to potentially notify`);
    
    const notificationPayload = {
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      timestamp: new Date().toLocaleString(),
      isRead: false,
      ...metadata
    };
    
    // Send notifications to users who have enabled this notification type
    for (const user of users) {
      console.log(`Checking user ${user._id} (${user.email}) - role: ${user.role}`);
      console.log(`User notification settings:`, user.notificationSettings);
      
      if (shouldSendNotification(user, type)) {
        console.log(`Sending notification to user ${user._id}`);
        
        // Send notification via chat server API
        try {
          const chatServerUrl = `http://localhost:${process.env.SOCKET_PORT || 5051}/api/notifications/send`;
          console.log(`Sending to chat server: ${chatServerUrl}`);
          
          await axios.post(chatServerUrl, {
            userId: user._id,
            notification: notificationPayload
          });
          
          console.log(`Notification sent to user ${user._id} (${user.email}):`, {
            type,
            title,
            message
          });
        } catch (error) {
          console.error(`Failed to send notification to user ${user._id}:`, error.message);
        }
      } else {
        console.log(`User ${user._id} has disabled ${type} notifications`);
      }
    }
    
    return { success: true, message: "Notifications sent successfully" };
  } catch (error) {
    console.error("Error sending notifications:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to check if user should receive notification based on their preferences
const shouldSendNotification = (user, notificationType) => {
  console.log(`🔍 shouldSendNotification - user: ${user._id}, type: ${notificationType}`);
  
  if (!user.notificationSettings) {
    console.log(`⚠️  No notification settings found for user ${user._id}, using defaults`);
    // Default behavior if no settings exist
    const result = notificationType !== "systemUpdate"; // Send all except system updates by default
    console.log(`📝 Default result: ${result}`);
    return result;
  }
  
  console.log(`🔧 User notification settings:`, user.notificationSettings);
  
  let result;
  switch (notificationType) {
    case "calendar":
      result = user.notificationSettings.calendar;
      console.log(`📅 Calendar notification setting: ${result}`);
      break;
    case "schoolUpdate":
    case "announcement":
      result = user.notificationSettings.schoolUpdate;
      console.log(`🏫 School update notification setting: ${result}`);
      break;
    case "gradeUpdate":
      result = user.notificationSettings.gradeUpdate;
      console.log(`📝 Grade update notification setting: ${result}`);
      break;
    case "message":
      result = user.notificationSettings.groupChat;
      console.log(`💬 Group chat notification setting: ${result}`);
      break;
    case "systemUpdate":
      result = user.notificationSettings.systemUpdate;
      console.log(`🔧 System update notification setting: ${result}`);
      break;
    default:
      result = true; // Unknown types are sent by default
      console.log(`❓ Unknown notification type, defaulting to: ${result}`);
  }
  
  console.log(`📊 Final result for ${notificationType}: ${result}`);
  return result;
};

// Specific helper for calendar notifications
export const sendCalendarNotification = async (event, action = "created") => {
  const actionText = action === "created" ? "created" : "updated";
  const title = `Calendar Event ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`;
  const message = `${event.title} - ${event.description || "No description"} on ${new Date(event.start).toLocaleDateString()}`;
  
  await sendNotificationToUsers({
    type: "calendar",
    title,
    message,
    targetAudience: event.targetAudience,
    metadata: {
      eventId: event._id,
      eventTitle: event.title,
      eventStart: event.start,
      eventEnd: event.end,
      category: event.category,
      action
    }
  });
};

// Specific helper for grade update notifications
export const sendGradeUpdateNotification = async (gradeData) => {
  await sendNotificationToUsers({
    type: "gradeUpdate",
    title: "Grade Update",
    message: `New grades have been posted for ${gradeData.subject || "a subject"}`,
    targetAudience: "students",
    metadata: {
      subject: gradeData.subject,
      grade: gradeData.grade,
      studentId: gradeData.studentId
    }
  });
};

// Specific helper for parent grade update notifications
export const sendParentGradeUpdateNotification = async (gradeData) => {
  const { parentId, studentName, subject, grade, studentId } = gradeData;
  
  // Send to specific parent only
  try {
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== "parent") {
      console.log("Parent not found or invalid role for grade notification");
      return;
    }
    
    // Check if parent has grade notifications enabled
    if (!shouldSendNotification(parent, "gradeUpdate")) {
      console.log(`Parent ${parentId} has grade notifications disabled`);
      return;
    }
    
    const notificationPayload = {
      id: Date.now() + Math.random(),
      type: "gradeUpdate",
      title: "New Grade Posted",
      message: `${studentName} received a new grade: ${grade} in ${subject}`,
      timestamp: new Date().toLocaleString(),
      isRead: false,
      metadata: {
        studentId,
        studentName,
        subject,
        grade
      }
    };
    
    // Send notification via chat server API
    const chatServerUrl = `http://localhost:${process.env.SOCKET_PORT || 5051}/api/notifications/send`;
    await axios.post(chatServerUrl, {
      userId: parentId,
      notification: notificationPayload
    });
    
    console.log(`Grade notification sent to parent ${parentId} for student ${studentName}`);
  } catch (error) {
    console.error("Error sending parent grade notification:", error);
  }
};

// Specific helper for announcement notifications
export const sendAnnouncementNotification = async (announcementData, action = "created") => {
  let title, message;
  
  switch (action) {
    case "created":
      title = "New School Announcement";
      message = `${announcementData.title} - ${announcementData.description?.substring(0, 50)}${announcementData.description?.length > 50 ? '...' : ''}`;
      break;
    case "updated":
      title = "Announcement Updated";
      message = `${announcementData.title} has been updated - ${announcementData.description?.substring(0, 50)}${announcementData.description?.length > 50 ? '...' : ''}`;
      break;
    case "deleted":
      title = "Announcement Removed";
      message = `The announcement "${announcementData.title}" has been removed`;
      break;
    default:
      title = "School Announcement";
      message = `${announcementData.title}`;
  }

  await sendNotificationToUsers({
    type: "schoolUpdate",
    title,
    message,
    targetAudience: announcementData.targetAudience || "all",
    metadata: {
      announcementId: announcementData._id,
      announcementTitle: announcementData.title,
      fullDescription: announcementData.description,
      action
    }
  });
};

// Specific helper for homework notifications
export const sendHomeworkNotification = async (homeworkData, action = "created") => {
  let title, message;
  
  switch (action) {
    case "created":
      title = "New Homework Assigned";
      message = `${homeworkData.title} - Due: ${new Date(homeworkData.dueDate).toLocaleDateString()}. Check your homework section for details.`;
      break;
    case "updated":
      title = "Homework Updated";
      message = `${homeworkData.title} has been updated - Due: ${new Date(homeworkData.dueDate).toLocaleDateString()}`;
      break;
    case "deleted":
      title = "Homework Removed";
      message = `The homework "${homeworkData.title}" has been removed`;
      break;
    default:
      title = "Homework Update";
      message = `${homeworkData.title} - Due: ${new Date(homeworkData.dueDate).toLocaleDateString()}`;
  }

  await sendNotificationToUsers({
    type: "schoolUpdate",
    title,
    message,
    targetAudience: "students",
    metadata: {
      homeworkId: homeworkData._id,
      homeworkTitle: homeworkData.title,
      subjectId: homeworkData.subject,
      subjectName: homeworkData.subjectName,
      dueDate: homeworkData.dueDate,
      week: homeworkData.week,
      action
    }
  });
};

// Specific helper for content notifications
export const sendContentNotification = async (contentData, action = "created") => {
  let title, message;
  
  switch (action) {
    case "created":
      title = "New Learning Content Available";
      message = `${contentData.title} - New materials have been added to your subjects. Check the content section to access them.`;
      break;
    case "updated":
      title = "Learning Content Updated";
      message = `${contentData.title} has been updated with new materials`;
      break;
    case "deleted":
      title = "Learning Content Removed";
      message = `The content "${contentData.title}" has been removed`;
      break;
    default:
      title = "Learning Content Update";
      message = `${contentData.title} - Check your subjects for new materials`;
  }

  await sendNotificationToUsers({
    type: "schoolUpdate",
    title,
    message,
    targetAudience: "students",
    metadata: {
      contentId: contentData._id,
      contentTitle: contentData.title,
      subjectId: contentData.subject,
      subjectName: contentData.subjectName,
      week: contentData.week,
      action
    }
  });
};

// Specific helper for system update notifications
export const sendSystemUpdateNotification = async (updateData) => {
  await sendNotificationToUsers({
    type: "systemUpdate",
    title: "System Update Available",
    message: updateData.message || "A new system update is available. Please check for the latest features and improvements.",
    targetAudience: "all",
    metadata: {
      version: updateData.version,
      updateType: updateData.updateType || "general",
      releaseNotes: updateData.releaseNotes,
      updateId: updateData._id || Date.now()
    }
  });
};