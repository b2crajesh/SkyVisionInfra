import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { listRanks } from "../controllers/rank.controller";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "MEMBER"), listRanks);

export default router;
