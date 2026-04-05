import React from "react";
import { render } from "@react-email/render";
import { prisma } from "../models/prismaClient.js";
import { resend } from "../integrations/resendClient.js";
import { ReminderEmail } from "../email/ReminderEmail.js";
import { env, getServiceReadinessSnapshot } from "../config/env.js";

function buildSubject(unreadCount) {
  return unreadCount === 1
    ? "You have 1 new Ziele update"
    : `You have ${unreadCount} new Ziele updates`;
}

function buildTextBody(profileName, unreadCount, highlights, appUrl) {
  return [
    `Hello ${profileName},`,
    "",
    `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"} on Ziele.`,
    "",
    ...highlights.map((item, index) => `${index + 1}. ${item}`),
    "",
    `Open your notifications: ${appUrl}/notifications`,
  ].join("\n");
}

async function findReminderCandidates(limit = 10) {
  const profiles = await prisma.profile.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      followers: "desc",
    },
    take: limit,
  });

  const candidates = [];

  for (const profile of profiles) {
    if (!profile.user?.email) continue;

    const [unreadNotifications, lastLog] = await Promise.all([
      prisma.notification.findMany({
        where: {
          targetUser: profile.id,
          read: false,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 5,
      }),
      prisma.emailReminderLog.findFirst({
        where: {
          profileId: profile.id,
          status: "sent",
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    if (unreadNotifications.length === 0) continue;

    const remindedRecently =
      lastLog &&
      Date.now() - new Date(lastLog.createdAt).getTime() < 24 * 60 * 60 * 1000;

    if (remindedRecently) {
      continue;
    }

    candidates.push({
      profile,
      unreadNotifications,
    });
  }

  return candidates;
}

async function logReminderAttempt({
  profileId,
  email,
  subject,
  status,
  notificationCount,
  errorMessage = null,
  providerMessageId = null,
  deliveredAt = null,
}) {
  return prisma.emailReminderLog.create({
    data: {
      profileId,
      email,
      subject,
      status,
      notificationCount,
      errorMessage,
      providerMessageId,
      deliveredAt,
    },
  });
}

export async function sendReminderBatch({ limit = 10 } = {}) {
  const appUrl = env.corsOrigins[0] || "http://localhost:5173";
  const candidates = await findReminderCandidates(limit);
  const results = [];

  for (const candidate of candidates) {
    const unreadCount = candidate.unreadNotifications.length;
    const subject = buildSubject(unreadCount);
    const highlights = candidate.unreadNotifications.map((notification) => {
      const actor = notification.sourceName || "Someone";
      const target = notification.postTitle ? ` on "${notification.postTitle}"` : "";
      return `${actor} triggered a ${notification.type} update${target}.`;
    });

    const html = await render(
      React.createElement(ReminderEmail, {
        profileName: candidate.profile.name,
        unreadCount,
        highlights,
        appUrl,
      }),
    );

    const text = buildTextBody(
      candidate.profile.name,
      unreadCount,
      highlights,
      appUrl,
    );

    if (!getServiceReadinessSnapshot().resend.configured || !resend) {
      await logReminderAttempt({
        profileId: candidate.profile.id,
        email: candidate.profile.user.email,
        subject,
        status: "skipped",
        notificationCount: unreadCount,
        errorMessage: "Resend is not configured.",
      });

      results.push({
        profileId: candidate.profile.id,
        status: "skipped",
        reason: "Resend is not configured.",
      });
      continue;
    }

    try {
      const response = await resend.emails.send({
        from: env.resend.fromEmail,
        to: candidate.profile.user.email,
        subject,
        html,
        text,
      });

      if (response.error) {
        throw new Error(response.error.message || "Resend returned an error.");
      }

      await logReminderAttempt({
        profileId: candidate.profile.id,
        email: candidate.profile.user.email,
        subject,
        status: "sent",
        notificationCount: unreadCount,
        providerMessageId: response.data?.id || null,
        deliveredAt: new Date(),
      });

      results.push({
        profileId: candidate.profile.id,
        status: "sent",
        notificationCount: unreadCount,
      });
    } catch (error) {
      await logReminderAttempt({
        profileId: candidate.profile.id,
        email: candidate.profile.user.email,
        subject,
        status: "failed",
        notificationCount: unreadCount,
        errorMessage: error.message || "Unknown resend failure.",
      });

      results.push({
        profileId: candidate.profile.id,
        status: "failed",
        reason: error.message || "Unknown resend failure.",
      });
    }
  }

  return {
    processed: results.length,
    results,
  };
}

