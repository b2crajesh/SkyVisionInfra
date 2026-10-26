import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { CreateContactInput } from "../validators/contact.validators";
import { sendContactEmail } from "../services/contactEmail";
import { logError, logInfo } from "../utils/logger";

export async function createContactMessage(
  req: Request<unknown, unknown, CreateContactInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, phone, subject, message } = req.body;
    const contact = await prisma.contactMessage.create({
      data: { name, email, phone, subject, message },
    });
    res.status(201).json({
      id: contact.id,
      message: "Your message was received. Email notifications are being processed separately.",
      emailDelivery: "processing",
    });
    setImmediate(() => {
      void sendContactEmail({ name, email, phone, subject, message })
        .then((delivery) => logInfo("contact.email.delivery_complete", delivery))
        .catch((err) => logError("contact.email.processing_failed", err));
    });
  } catch (err) {
    next(err);
  }
}
