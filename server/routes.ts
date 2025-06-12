import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudyScheduleSchema, insertStudySessionSchema, insertPdfDocumentSchema } from "@shared/schema";
import { analyzeEditalPDF, extractTextFromPDF } from "./openai";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get user stats
  app.get("/api/user/:userId/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Schedule routes
  app.get("/api/user/:userId/schedules", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const schedules = await storage.getSchedulesByUserId(userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schedules" });
    }
  });

  app.post("/api/user/:userId/schedules", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const scheduleData = insertStudyScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule({ ...scheduleData, userId });
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schedule" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const schedule = await storage.updateSchedule(id, updates);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSchedule(id);
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Study session routes
  app.get("/api/user/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await storage.getRecentSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.post("/api/user/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessionData = insertStudySessionSchema.parse(req.body);
      const session = await storage.createSession({ ...sessionData, userId });
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  // PDF document routes
  app.get("/api/user/:userId/pdfs", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const pdfs = await storage.getPdfsByUserId(userId);
      res.json(pdfs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get PDFs" });
    }
  });

  app.post("/api/user/:userId/pdfs", upload.single('pdf'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const pdfData = {
        title: req.body.title || req.file.originalname,
        filename: req.file.originalname,
      };
      
      const pdf = await storage.createPdf({ ...pdfData, userId });
      res.json(pdf);
    } catch (error) {
      res.status(400).json({ message: "Failed to upload PDF" });
    }
  });

  app.get("/api/pdfs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pdf = await storage.getPdf(id);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }
      res.json(pdf);
    } catch (error) {
      res.status(500).json({ message: "Failed to get PDF" });
    }
  });

  app.put("/api/pdfs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const pdf = await storage.updatePdf(id, updates);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }
      res.json(pdf);
    } catch (error) {
      res.status(500).json({ message: "Failed to update PDF" });
    }
  });

  app.delete("/api/pdfs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePdf(id);
      if (!deleted) {
        return res.status(404).json({ message: "PDF not found" });
      }
      res.json({ message: "PDF deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
