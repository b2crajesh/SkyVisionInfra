import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createSaleSchema,
  listSalesQuerySchema,
  saleIdParamsSchema,
  updateSaleSchema,
} from "../validators/sale.validators";
import {
  createSale,
  deleteSale,
  getMySales,
  listSales,
  updateSale,
} from "../controllers/sale.controller";

const router = Router();

router.use(authenticate);

router.get("/me", authorize("MEMBER"), getMySales);
router.get("/", authorize("ADMIN"), validate({ query: listSalesQuerySchema }), listSales);
router.post("/", authorize("ADMIN"), validate({ body: createSaleSchema }), createSale);
router.put(
  "/:id",
  authorize("ADMIN"),
  validate({ params: saleIdParamsSchema, body: updateSaleSchema }),
  updateSale
);
router.delete("/:id", authorize("ADMIN"), validate({ params: saleIdParamsSchema }), deleteSale);

export default router;
