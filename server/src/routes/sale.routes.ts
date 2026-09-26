import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createSaleSchema, listSalesQuerySchema } from "../validators/sale.validators";
import { createSale, getMySales, listSales } from "../controllers/sale.controller";

const router = Router();

router.use(authenticate);

router.get("/me", authorize("MEMBER"), getMySales);
router.get("/", authorize("ADMIN"), validate({ query: listSalesQuerySchema }), listSales);
router.post("/", authorize("ADMIN"), validate({ body: createSaleSchema }), createSale);

export default router;
