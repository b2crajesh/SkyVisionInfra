import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { CreateContactInput } from "../validators/contact.validators";

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
    res.status(201).json({ id: contact.id, message: "Thank you, we will get back to you shortly." });
  } catch (err) {
    next(err);
  }
}
