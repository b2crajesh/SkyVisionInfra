import { Router } from "express";
import { login, logout, me, changePassword } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { loginSchema, changePasswordSchema } from "../validators/auth.validators";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  changePassword
);

export default router;
