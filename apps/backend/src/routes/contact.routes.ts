import { Router, Request, Response } from "express";
import { query, queryOne } from "../core/db/pool";
import { logger } from "../core/config/logger";
import { sendEmail } from "../infrastructure/email.service";
import { z } from "zod";

const router = Router();

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(5, "Subject required"),
  message: z.string().min(10, "Message required"),
});

/**
 * POST /api/contact/submit
 * Submit a contact form message
 * Sends email notification to support team
 */
router.post(
  "/submit",
  async (req: Request, res: Response) => {
    try {
      const data = contactSchema.parse(req.body);

      // Insert into database
      const result = await queryOne(
        `INSERT INTO contact_messages (name, email, subject, message, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, created_at`,
        [data.name, data.email, data.subject, data.message, req.ip || "unknown"]
      );

      logger.info("Contact message received", {
        email: data.email,
        subject: data.subject,
        ip: req.ip,
      });

      // Send email notification to support team
      try {
        await sendEmail({
          to: process.env.SUPPORT_EMAIL || "support@dkp.edu.bd",
          subject: `New Contact Form: ${data.subject}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>From:</strong> ${data.name} (${data.email})</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${data.message.replace(/\n/g, "<br>")}</p>
            <hr>
            <p><small>IP Address: ${req.ip || "unknown"}</small></p>
            <p><small>Received: ${new Date().toISOString()}</small></p>
          `,
        });
        logger.info("Support notification email sent", { email: data.email });
      } catch (emailError) {
        logger.error("Failed to send support notification email", { emailError });
      }

      res.status(201).json({
        success: true,
        message: "Message received. We'll get back to you soon!",
        id: result?.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      logger.error("Contact submission error", { error });
      res.status(500).json({
        success: false,
        message: "Failed to submit message",
      });
    }
  }
);

/**
 * GET /api/contact/messages
 * Get all contact messages (Admin only)
 */
router.get(
  "/messages",
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      if (!userId || userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }

      const result = await query(
        `SELECT id, name, email, subject, message, ip_address, is_read, created_at
         FROM contact_messages
         ORDER BY created_at DESC
         LIMIT 100`
      );

      res.json({
        success: true,
        total: result.length,
        messages: result,
      });
    } catch (error) {
      logger.error("Failed to fetch contact messages", { error });
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
      });
    }
  }
);

/**
 * PATCH /api/contact/messages/:id/read
 * Mark a message as read (Admin only)
 */
router.patch(
  "/messages/:id/read",
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      if (!userId || userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }

      const { id } = req.params;

      await query(
        `UPDATE contact_messages SET is_read = true WHERE id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: "Message marked as read",
      });
    } catch (error) {
      logger.error("Failed to mark message as read", { error });
      res.status(500).json({
        success: false,
        message: "Failed to update message",
      });
    }
  }
);

/**
 * DELETE /api/contact/messages/:id
 * Delete a contact message (Admin only)
 */
router.delete(
  "/messages/:id",
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      if (!userId || userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }

      const { id } = req.params;

      await query(`DELETE FROM contact_messages WHERE id = $1`, [id]);

      logger.info("Contact message deleted", { messageId: id });

      res.json({
        success: true,
        message: "Message deleted",
      });
    } catch (error) {
      logger.error("Failed to delete message", { error });
      res.status(500).json({
        success: false,
        message: "Failed to delete message",
      });
    }
  }
);

export default router;
