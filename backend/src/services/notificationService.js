import {
  countUnreadNotifications,
  createNotificationRecord,
  getNotificationsByTarget,
  markAllNotificationsRead,
} from "../models/notificationModel.js";
import {
  publishRedisMessage,
  subscribeRedisChannel,
} from "../integrations/redisClient.js";

const REDIS_CHANNEL = "ziele:notifications";
let localEmitter = null;
let bridgePromise = null;

function notificationRoom(profileId) {
  return `profile:${profileId}`;
}

export function registerNotificationEmitter(emitter) {
  localEmitter = emitter;

  if (!bridgePromise) {
    bridgePromise = subscribeRedisChannel(REDIS_CHANNEL, (payload) => {
      if (!payload?.targetUser || !localEmitter) return;
      localEmitter(notificationRoom(payload.targetUser), payload);
    }).catch(() => false);
  }
}

function emitNotificationLocally(payload) {
  if (!payload?.targetUser || !localEmitter) return;
  localEmitter(notificationRoom(payload.targetUser), payload);
}

export async function notifyProfile({
  targetUser,
  type,
  sourceProfile,
  postTitle = "",
  content = "",
  metadata = {},
}) {
  if (!targetUser || !sourceProfile?.id) return null;

  if (targetUser === sourceProfile.id) {
    return null;
  }

  const notification = await createNotificationRecord({
    targetUser,
    type,
    sourceName: sourceProfile.name,
    sourceHandle: sourceProfile.handle,
    sourceAvatar: sourceProfile.avatar,
    postTitle,
    content,
    metadata,
  });

  const published = await publishRedisMessage(REDIS_CHANNEL, notification).catch(
    () => false,
  );

  if (!published) {
    emitNotificationLocally(notification);
  }

  return notification;
}

export async function listNotificationsForProfile(profileId) {
  return getNotificationsByTarget(profileId);
}

export async function getUnreadNotificationsCount(profileId) {
  return countUnreadNotifications(profileId);
}

export async function markNotificationsRead(profileId) {
  await markAllNotificationsRead(profileId);
  return true;
}
