import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listCommissionsQuerySchema } from "../validators/commission.validators";
import { getMyCommissions, listCommissions } from "../controllers/commission.controller";

const router = Router();

router.use(authenticate);

router.get("/me", authorize("MEMBER"), getMyCommissions);
router.get("/", authorize("ADMIN"), validate({ query: listCommissionsQuerySchema }), listCommissions);

export default router;
