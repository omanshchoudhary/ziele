import { prisma } from "./prismaClient.js";

function normalizeNotification(record) {
  if (!record) return null;

  return {
    id: record.id,
    type: record.type,
    targetUser: record.targetUser,
    user: {
      name: record.sourceName || "Ziele User",
      avatar: record.sourceAvatar || null,
      handle: record.sourceHandle || null,
    },
    target: record.postTitle || "",
    content: record.content || "",
    metadata: record.metadata || {},
    read: Boolean(record.read),
    timestamp: record.timestamp,
  };
}

export async function getNotificationsByTarget(targetUser) {
  const records = await prisma.notification.findMany({
    where: {
      targetUser,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 50,
  });

  return records.map(normalizeNotification);
}

export async function createNotificationRecord({
  targetUser,
  type,
  sourceName,
  sourceHandle,
  sourceAvatar,
  postTitle,
  content,
  metadata,
}) {
  const record = await prisma.notification.create({
    data: {
      targetUser,
      type,
      sourceName,
      sourceHandle,
      sourceAvatar,
      postTitle,
      content,
      metadata,
    },
  });

  return normalizeNotification(record);
}

export async function countUnreadNotifications(targetUser) {
  return prisma.notification.count({
    where: {
      targetUser,
      read: false,
    },
  });
}

export async function markAllNotificationsRead(targetUser) {
  await prisma.notification.updateMany({
    where: {
      targetUser,
      read: false,
    },
    data: {
      read: true,
    },
  });
}
