import { readStore, withStore } from "../data/store.js";

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

function nextNumericId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function ensureStoreShape(state) {
  if (!Array.isArray(state.users)) state.users = [];
  if (!Array.isArray(state.profiles)) state.profiles = [];
  if (!Array.isArray(state.posts)) state.posts = [];
  if (!Array.isArray(state.comments)) state.comments = [];
  if (!Array.isArray(state.notifications)) state.notifications = [];
  return state;
}

function getPrimaryEmail(clerkUser = {}) {
  if (clerkUser.email) return normalizeEmail(clerkUser.email);

  if (Array.isArray(clerkUser.email_addresses) && clerkUser.email_addresses.length > 0) {
    const primaryId = clerkUser.primary_email_address_id;
    const picked =
      clerkUser.email_addresses.find((entry) => entry.id === primaryId) ||
      clerkUser.email_addresses[0];
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
  if (normalizeString(clerkUser.external_id)) return normalizeString(clerkUser.external_id);
  return "Ziele User";
}

function makeAvatar(name) {
  const words = normalizeString(name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ZU";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function uniqueHandle(baseHandle, profiles) {
  const existing = new Set(
    profiles.map((profile) => normalizeHandle(profile.handle)).filter(Boolean),
  );

  const base = normalizeHandle(baseHandle || "@user");
  if (!existing.has(base)) return base;

  let i = 1;
  while (i <= 10000) {
    const candidate = normalizeHandle(`${base.replace(/^@/, "")}${i}`);
    if (!existing.has(candidate)) return candidate;
    i += 1;
  }

  return normalizeHandle(`${base.replace(/^@/, "")}${randomSuffix(6)}`);
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

function getJoinedLabel(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function profilePostCount(profileId, posts = []) {
  return posts.filter((post) => normalizeString(post.profileId) === normalizeString(profileId))
    .length;
}

function buildNewRecords(clerkUser, state) {
  const clerkId = normalizeString(clerkUser?.id);
  if (!clerkId) throw new Error("Missing Clerk user ID");

  const nowIso = new Date().toISOString();
  const email = getPrimaryEmail(clerkUser);
  const name = getDisplayName(clerkUser);
  const handleCandidate = deriveHandleCandidate(clerkUser, email, name);
  const handle = uniqueHandle(handleCandidate, state.profiles);
  const profileId = normalizeString(handle).replace(/^@/, "") || `user${randomSuffix(6)}`;

  const userRecord = {
    id: nextNumericId(state.users),
    clerkId,
    email,
    username: normalizeString(clerkUser.username),
    firstName: normalizeString(clerkUser.first_name || clerkUser.firstName),
    lastName: normalizeString(clerkUser.last_name || clerkUser.lastName),
    imageUrl: normalizeString(clerkUser.image_url || clerkUser.imageUrl),
    createdAt: nowIso,
    updatedAt: nowIso,
    profileId,
  };

  const profileRecord = {
    id: profileId,
    clerkId,
    name,
    handle,
    bio: "New to Ziele. Excited to start sharing stories.",
    avatar: makeAvatar(name),
    followers: 0,
    following: 0,
    posts: 0,
    likes: 0,
    streak: 0,
    isPremium: false,
    joined: getJoinedLabel(nowIso),
  };

  return { userRecord, profileRecord };
}

function sanitizePatchObject(patch = {}) {
  if (!patch || typeof patch !== "object") return {};
  const next = { ...patch };
  delete next.id;
  delete next.createdAt;
  return next;
}

export function getClerkUsers() {
  const state = ensureStoreShape(readStore());
  return state.users;
}

export function findUserByClerkId(clerkId) {
  const id = normalizeString(clerkId);
  if (!id) return null;
  const state = ensureStoreShape(readStore());
  return state.users.find((user) => normalizeString(user.clerkId) === id) || null;
}

export function findProfileByClerkId(clerkId) {
  const id = normalizeString(clerkId);
  if (!id) return null;
  const state = ensureStoreShape(readStore());

  const directProfile = state.profiles.find(
    (profile) => normalizeString(profile.clerkId) === id,
  );
  if (directProfile) return directProfile;

  const user = state.users.find((entry) => normalizeString(entry.clerkId) === id);
  if (!user) return null;

  return (
    state.profiles.find(
      (profile) =>
        normalizeString(profile.id) === normalizeString(user.profileId) ||
        normalizeString(profile.handle).replace(/^@/, "") === normalizeString(user.profileId),
    ) || null
  );
}

export function upsertUserFromClerk(clerkUser) {
  const clerkId = normalizeString(clerkUser?.id);
  if (!clerkId) throw new Error("Missing Clerk user ID");

  const result = withStore((draft) => {
    ensureStoreShape(draft);

    const existingUserIndex = draft.users.findIndex(
      (user) => normalizeString(user.clerkId) === clerkId,
    );

    const nowIso = new Date().toISOString();
    const email = getPrimaryEmail(clerkUser);
    const displayName = getDisplayName(clerkUser);
    const firstName = normalizeString(clerkUser.first_name || clerkUser.firstName);
    const lastName = normalizeString(clerkUser.last_name || clerkUser.lastName);
    const username = normalizeString(clerkUser.username);
    const imageUrl = normalizeString(clerkUser.image_url || clerkUser.imageUrl);

    if (existingUserIndex === -1) {
      const { userRecord, profileRecord } = buildNewRecords(clerkUser, draft);

      draft.users.push(userRecord);
      draft.profiles.push(profileRecord);

      return draft;
    }

    const currentUser = draft.users[existingUserIndex];
    const profileId = normalizeString(currentUser.profileId);

    const mergedUser = {
      ...currentUser,
      email: email || currentUser.email || "",
      username: username || currentUser.username || "",
      firstName: firstName || currentUser.firstName || "",
      lastName: lastName || currentUser.lastName || "",
      imageUrl: imageUrl || currentUser.imageUrl || "",
      updatedAt: nowIso,
      profileId: profileId || currentUser.profileId,
    };

    draft.users[existingUserIndex] = mergedUser;

    const existingProfileIndex = draft.profiles.findIndex(
      (profile) =>
        normalizeString(profile.id) === profileId ||
        normalizeString(profile.clerkId) === clerkId,
    );

    if (existingProfileIndex === -1) {
      const handleCandidate = deriveHandleCandidate(clerkUser, email, displayName);
      const handle = uniqueHandle(handleCandidate, draft.profiles);
      const newProfileId = profileId || normalizeString(handle).replace(/^@/, "") || `user${randomSuffix(6)}`;

      draft.profiles.push({
        id: newProfileId,
        clerkId,
        name: displayName,
        handle,
        bio: "New to Ziele. Excited to start sharing stories.",
        avatar: makeAvatar(displayName),
        followers: 0,
        following: 0,
        posts: profilePostCount(newProfileId, draft.posts),
        likes: 0,
        streak: 0,
        isPremium: false,
        joined: getJoinedLabel(nowIso),
      });

      draft.users[existingUserIndex] = {
        ...draft.users[existingUserIndex],
        profileId: newProfileId,
      };
    } else {
      const profile = draft.profiles[existingProfileIndex];
      const shouldUpdateName = Boolean(displayName);
      const nextName = shouldUpdateName ? displayName : profile.name;
      const nextAvatar = profile.avatar || makeAvatar(nextName);

      draft.profiles[existingProfileIndex] = {
        ...profile,
        clerkId,
        name: nextName,
        avatar: nextAvatar,
        posts: profilePostCount(profile.id, draft.posts),
      };
    }

    return draft;
  });

  return result.users.find((user) => normalizeString(user.clerkId) === clerkId) || null;
}

export function patchUserByClerkId(clerkId, userPatch = {}, profilePatch = {}) {
  const id = normalizeString(clerkId);
  if (!id) throw new Error("Missing Clerk user ID");

  const safeUserPatch = sanitizePatchObject(userPatch);
  const safeProfilePatch = sanitizePatchObject(profilePatch);

  const updatedState = withStore((draft) => {
    ensureStoreShape(draft);

    const userIndex = draft.users.findIndex((user) => normalizeString(user.clerkId) === id);
    if (userIndex === -1) return draft;

    draft.users[userIndex] = {
      ...draft.users[userIndex],
      ...safeUserPatch,
      clerkId: id,
      updatedAt: new Date().toISOString(),
    };

    const profileId = normalizeString(draft.users[userIndex].profileId);
    const profileIndex = draft.profiles.findIndex(
      (profile) =>
        normalizeString(profile.id) === profileId ||
        normalizeString(profile.clerkId) === id,
    );

    if (profileIndex !== -1) {
      draft.profiles[profileIndex] = {
        ...draft.profiles[profileIndex],
        ...safeProfilePatch,
        clerkId: id,
      };
    }

    return draft;
  });

  return updatedState.users.find((user) => normalizeString(user.clerkId) === id) || null;
}

export function deleteUserByClerkId(clerkId) {
  const id = normalizeString(clerkId);
  if (!id) return false;

  let removed = false;

  withStore((draft) => {
    ensureStoreShape(draft);

    const userIndex = draft.users.findIndex((user) => normalizeString(user.clerkId) === id);
    if (userIndex === -1) return draft;

    const profileId = normalizeString(draft.users[userIndex].profileId);
    draft.users.splice(userIndex, 1);

    const profileIndex = draft.profiles.findIndex(
      (profile) =>
        normalizeString(profile.id) === profileId ||
        normalizeString(profile.clerkId) === id,
    );

    if (profileIndex !== -1) {
      draft.profiles.splice(profileIndex, 1);
    }

    removed = true;
    return draft;
  });

  return removed;
}

export function getProfileForClerkUser(clerkId) {
  return findProfileByClerkId(clerkId);
}
