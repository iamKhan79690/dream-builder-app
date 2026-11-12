import { Router } from "express";
import { z } from "zod";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "../lib/password.js";
import { requireParent } from "../middleware/requireParent.js";
import { validate } from "../middleware/validate.js";
import { clearSessionCookie, createSession, deleteSession, SESSION_COOKIE } from "../services/sessions.js";
import { createUser, findUserByEmail, toPublicUser } from "../services/users.js";

// Trim spaces and lowercase, so " Ana@X.com " and "ana@x.com" are the same account.
const emailField = z.string().trim().toLowerCase().pipe(z.email());

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailField,
  // max(128): scrypt on a huge string would let someone tie up the server.
  password: z.string().min(8).max(128),
  consent: z.literal(true, { error: "Parental consent is required" }),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});

const INVALID_LOGIN = "Invalid email or password";

export const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body as z.infer<typeof signupSchema>;

  const user = await createUser({
    name,
    email,
    passwordHash: await hashPassword(password),
    consentAt: new Date(), // consent was validated as true just above
  });

  if (!user) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  await createSession(res, user.id);
  res.status(201).json({ user: toPublicUser(user) });
  return;
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await findUserByEmail(email);
  // Always run the slow hash, even for unknown emails, and always give the same
  // message, so nobody can use this form to find out who has an account.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !ok) {
    res.status(401).json({ error: INVALID_LOGIN });
    return;
  }

  await createSession(res, user.id);
  res.json({ user: toPublicUser(user) });
  return;
});

// Works even when already logged out, so the frontend can always call it safely.
authRouter.post("/logout", async (req, res) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token !== "") {
    await deleteSession(token);
  }
  clearSessionCookie(res);
  res.status(204).end();
  return;
});

authRouter.get("/me", requireParent, (req, res) => {
  res.json({ user: req.user });
  return;
});
