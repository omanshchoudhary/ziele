import { deleteCommentById } from "../models/postModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  const profile = await getProfileForClerkUser(clerkUserId);
  req.resolvedProfile = profile || null;
  return profile;
}

export const deleteComment = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const deleted = await deleteCommentById(req.params.id, authProfile.id);
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.status(204).send();
  } catch (error) {
    const status = Number(error?.statusCode || 500);
    res.status(status).json({ error: error.message || "Failed to delete comment" });
  }
};
