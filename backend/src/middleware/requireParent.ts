import type { RequestHandler } from "express";
import { clearSessionCookie, getUserForToken, SESSION_COOKIE } from "../services/sessions.js";
import { toPublicUser } from "../services/users.js";

// Put this in front of any route that needs a logged-in parent.
// It reads the "sid" cookie, loads the session + user, and sets req.user.
export const requireParent: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];

  if (typeof token !== "string" || token === "") {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const user = await getUserForToken(token);
  if (!user) {
    // Unknown or expired session: also remove the dead cookie from the browser.
    clearSessionCookie(res);
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  if (user.role !== "parent") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.user = toPublicUser(user);
  next();
};
