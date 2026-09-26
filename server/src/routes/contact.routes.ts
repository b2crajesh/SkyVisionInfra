import { Router } from "express";
import { validate } from "../middleware/validate";
import { createContactSchema } from "../validators/contact.validators";
import { createContactMessage } from "../controllers/contact.controller";

const router = Router();

router.post("/", validate({ body: createContactSchema }), createContactMessage);

export default router;
