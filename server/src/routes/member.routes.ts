import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createMemberSchema,
  idParamSchema,
  listMembersQuerySchema,
  updateMemberSchema,
} from "../validators/member.validators";
import {
  createMember,
  deleteMember,
  getMemberById,
  getMyMember,
  listMembers,
  resetMemberPassword,
  updateMember,
} from "../controllers/member.controller";

const router = Router();

router.use(authenticate);

router.get("/me", authorize("MEMBER"), getMyMember);
router.get("/", authorize("ADMIN"), validate({ query: listMembersQuerySchema }), listMembers);
router.get("/:id", authorize("ADMIN"), validate({ params: idParamSchema }), getMemberById);
router.post("/", authorize("ADMIN"), validate({ body: createMemberSchema }), createMember);
router.patch(
  "/:id",
  authorize("ADMIN"),
  validate({ params: idParamSchema, body: updateMemberSchema }),
  updateMember
);
router.delete("/:id", authorize("ADMIN"), validate({ params: idParamSchema }), deleteMember);
router.post(
  "/:id/reset-password",
  authorize("ADMIN"),
  validate({ params: idParamSchema }),
  resetMemberPassword
);

export default router;
