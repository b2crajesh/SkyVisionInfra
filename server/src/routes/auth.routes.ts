import { Router } from "express";
import {
  changePassword,
  limitAdminPasswordRecovery,
  login,
  logout,
  me,
  requestAdminPasswordRecovery,
  resetAdminPassword,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  adminRecoveryRequestSchema,
  adminRecoveryResetSchema,
  changePasswordSchema,
  loginSchema,
} from "../validators/auth.validators";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post(
  "/admin/password-recovery",
  limitAdminPasswordRecovery,
  validate({ body: adminRecoveryRequestSchema }),
  requestAdminPasswordRecovery
);
router.post(
  "/admin/reset-password",
  validate({ body: adminRecoveryResetSchema }),
  resetAdminPassword
);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  changePassword
);

export default router;
