import type { PublicUser } from "../services/users.js";

// Teach TypeScript that Express requests can carry a logged-in user.
// requireParent sets it; handlers after requireParent can read req.user.
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
