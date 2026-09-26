import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getSummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/summary", authenticate, authorize("ADMIN"), getSummary);

export default router;
