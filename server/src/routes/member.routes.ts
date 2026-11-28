import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { parseProfilePhotoUpload } from "../middleware/profilePhotoUpload";
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
  getMemberProfilePhoto,
  getMyMember,
  getMyNetwork,
  getMyProfilePhoto,
  listMembers,
  resetMemberPassword,
  updateMember,
  uploadMemberProfilePhoto,
  uploadMyProfilePhoto,
} from "../controllers/member.controller";

const router = Router();

router.use(authenticate);

router.get("/me/network", authorize("MEMBER"), getMyNetwork);
router.get("/me", authorize("MEMBER"), getMyMember);
router.get("/me/photo", authorize("MEMBER"), getMyProfilePhoto);
router.post("/me/photo", authorize("MEMBER"), parseProfilePhotoUpload, uploadMyProfilePhoto);
router.get("/", authorize("ADMIN"), validate({ query: listMembersQuerySchema }), listMembers);
router.get(
  "/:id/photo",
  authorize("ADMIN"),
  validate({ params: idParamSchema }),
  getMemberProfilePhoto
);
router.post(
  "/:id/photo",
  authorize("ADMIN"),
  validate({ params: idParamSchema }),
  parseProfilePhotoUpload,
  uploadMemberProfilePhoto
);
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
