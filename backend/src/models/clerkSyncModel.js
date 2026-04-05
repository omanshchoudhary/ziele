import { prisma } from "./prismaClient.js";

// ============================================================================
// HELPER FUNCTIONS (Formatting strings before saving to DB)
// ============================================================================
function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeHandle(value) {
  const raw = normalizeString(value).toLowerCase();
  if (!raw) return "";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function slugify(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function randomSuffix(length = 4) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function getPrimaryEmail(clerkUser = {}) {
  if (clerkUser.email) return normalizeEmail(clerkUser.email);
  if (Array.isArray(clerkUser.email_addresses) && clerkUser.email_addresses.length > 0) {
    const primaryId = clerkUser.primary_email_address_id;
    const picked = clerkUser.email_addresses.find((entry) => entry.id === primaryId) || clerkUser.email_addresses[0];
    return normalizeEmail(picked?.email_address);
  }
  return "";
}

function getDisplayName(clerkUser = {}) {
  const firstName = normalizeString(clerkUser.first_name || clerkUser.firstName);
  const lastName = normalizeString(clerkUser.last_name || clerkUser.lastName);
  const full = `${firstName} ${lastName}`.trim();

  if (full) return full;
  if (normalizeString(clerkUser.username)) return normalizeString(clerkUser.username);
  return "Ziele User";
}

function makeAvatar(name) {
  const words = normalizeString(name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ZU";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function deriveHandleCandidate(clerkUser = {}, email = "", name = "") {
  const username = normalizeString(clerkUser.username);
  if (username) return `@${username}`;
  const fromName = slugify(name);
  if (fromName) return `@${fromName}`;
  const fromEmail = slugify(email.split("@")[0]);
  if (fromEmail) return `@${fromEmail}`;
  return `@user${randomSuffix(4)}`;
}

async function getUniqueHandle(baseHandle) {
  let candidate = normalizeHandle(baseHandle || "@user");
  let exists = await prisma.profile.findUnique({ where: { handle: candidate }});
  
  if (!exists) return candidate;
  
  // if exists, append random suffixes until unique
  while(exists) {
    candidate = normalizeHandle(`${baseHandle.replace(/^@/, "")}${randomSuffix(4)}`);
    exists = await prisma.profile.findUnique({ where: { handle: candidate }});
  }
  return candidate;
}

// ============================================================================
// EXPORTED PRISMA LOGIC
// ============================================================================

export async function getClerkUsers() {
  return await prisma.user.findMany({ include: { profile: true } });
}

export async function findUserByClerkId(clerkId) {
  if (!clerkId) return null;
  return await prisma.user.findUnique({
    where: { clerkId: String(clerkId) },
    include: { profile: true }
  });
}

export async function findProfileByClerkId(clerkId) {
  if (!clerkId) return null;
  return await prisma.profile.findUnique({
    where: { clerkId: String(clerkId) }
  });
}

export async function getProfileForClerkUser(clerkId) {
  return await findProfileByClerkId(clerkId);
}

// Fired by webhook when user signs up or changes their Clerk profile
export async function upsertUserFromClerk(clerkUser) {
  const clerkId = normalizeString(clerkUser?.id);
  if (!clerkId) throw new Error("Missing Clerk user ID");

  const email = getPrimaryEmail(clerkUser);
  const displayName = getDisplayName(clerkUser);
  const username = normalizeString(clerkUser.username);
  const firstName = normalizeString(clerkUser.first_name || clerkUser.firstName);
  const lastName = normalizeString(clerkUser.last_name || clerkUser.lastName);
  const imageUrl = normalizeString(clerkUser.image_url || clerkUser.imageUrl);

  const existingUser = await prisma.user.findUnique({ where: { clerkId } });

  if (!existingUser) {
    // ---------------------------------------------
    // CREATE NEW USER & PROFILE
    // ---------------------------------------------
    const handleCandidate = deriveHandleCandidate(clerkUser, email, displayName);
    const handle = await getUniqueHandle(handleCandidate);
    const profileId = handle.replace(/^@/, "");

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        username,
        firstName,
        lastName,
        imageUrl,
        profile: {
          create: {
            id: profileId,
            name: displayName,
            handle,
            avatar: makeAvatar(displayName),
            joined: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          }
        }
      },
      include: { profile: true }
    });
    return newUser;
  } else {
    // ---------------------------------------------
    // UPDATE EXISTING USER
    // ---------------------------------------------
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        email,
        username,
        firstName,
        lastName,
        imageUrl
      },
      include: { profile: true }
    });

    // Optionally update profile name if it changed
    if (updatedUser.profile && displayName !== updatedUser.profile.name) {
      await prisma.profile.update({
        where: { clerkId },
        data: {
          name: displayName,
          avatar: makeAvatar(displayName)
        }
      });
    }

    return updatedUser;
  }
}

export async function patchUserByClerkId(clerkId, userPatch = {}, profilePatch = {}) {
  const id = normalizeString(clerkId);
  if (!id) throw new Error("Missing Clerk user ID");

  let user = await prisma.user.findUnique({ where: { clerkId: id } });
  if (!user) return null;

  if (Object.keys(userPatch).length > 0) {
    user = await prisma.user.update({
      where: { clerkId: id },
      data: userPatch,
      include: { profile: true }
    });
  }

  if (Object.keys(profilePatch).length > 0) {
    await prisma.profile.update({
      where: { clerkId: id },
      data: profilePatch
    });
  }

  return user;
}

export async function deleteUserByClerkId(clerkId) {
  const id = normalizeString(clerkId);
  if (!id) return false;

  try {
    // Because we use onDelete: Cascade in schema.prisma, 
    // deleting the User automatically deletes the Profile!
    await prisma.user.delete({ where: { clerkId: id } });
    return true;
  } catch (err) {
    return false;
  }
}
