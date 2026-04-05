import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Webhook } from "svix";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function requireValue(name, value) {
  if (!String(value || "").trim()) {
    throw new Error(`Missing required value: ${name}`);
  }
  return String(value).trim();
}

function buildUserCreatedEvent({
  clerkId,
  email,
  username,
  firstName,
  lastName,
  imageUrl,
}) {
  // The backend sync logic reads these Clerk-style fields when creating
  // the local User and Profile rows.
  const emailAddressId = `idn_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

  return {
    object: "event",
    type: "user.created",
    data: {
      id: clerkId,
      object: "user",
      username,
      first_name: firstName,
      last_name: lastName,
      image_url: imageUrl,
      primary_email_address_id: emailAddressId,
      email_addresses: [
        {
          id: emailAddressId,
          email_address: email,
        },
      ],
    },
  };
}

async function main() {
  const targetUrl = getArg(
    "url",
    process.env.CLERK_WEBHOOK_TARGET_URL || "http://localhost:3001/api/webhooks/clerk",
  );
  const webhookSecret = requireValue(
    "CLERK_WEBHOOK_SIGNING_SECRET or --secret",
    getArg("secret", process.env.CLERK_WEBHOOK_SIGNING_SECRET || ""),
  );

  // We generate unique defaults so repeated runs can create distinct users
  // without colliding on unique email/clerkId constraints.
  const seed = Date.now();
  const clerkId = getArg("clerk-id", `user_debug_${seed}`);
  const email = getArg("email", `debug.user.${seed}@example.com`);
  const username = getArg("username", `debuguser${String(seed).slice(-6)}`);
  const firstName = getArg("first-name", "Debug");
  const lastName = getArg("last-name", "User");
  const imageUrl = getArg(
    "image-url",
    "https://images.clerk.dev/default-avatar.png",
  );

  const event = buildUserCreatedEvent({
    clerkId,
    email,
    username,
    firstName,
    lastName,
    imageUrl,
  });
  const payload = JSON.stringify(event);

  const timestamp = new Date();
  const msgId = `msg_${randomUUID().replace(/-/g, "")}`;
  const signature = new Webhook(webhookSecret).sign(msgId, timestamp, payload);

  const headers = {
    "content-type": "application/json",
    "svix-id": msgId,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  };

  const response = await fetch(targetUrl, {
    method: "POST",
    headers,
    body: payload,
  });

  const responseText = await response.text();

  console.log("Webhook target:", targetUrl);
  console.log("HTTP status:", response.status, response.statusText);
  console.log("Sent payload:");
  console.log(
    JSON.stringify(
      {
        clerkId,
        email,
        username,
        firstName,
        lastName,
      },
      null,
      2,
    ),
  );
  console.log("Response body:");
  console.log(responseText);

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to send signed Clerk webhook:", error.message);
  process.exitCode = 1;
});
