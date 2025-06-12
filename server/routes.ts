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

  // AI-powered schedule creation from edital
  app.post("/api/user/:userId/schedules/ai-generate", upload.single('editalPdf'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { examDate, title } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "PDF do edital é obrigatório" });
      }

      if (!examDate) {
        return res.status(400).json({ message: "Data do concurso é obrigatória" });
      }

      // Validar data do concurso
      const examDateObj = new Date(examDate);
      const today = new Date();
      if (examDateObj <= today) {
        return res.status(400).json({ message: "Data do concurso deve ser futura" });
      }

      // First, save the edital PDF
      const editalPdf = await storage.createPdf({
        title: title || `Edital - ${req.file.originalname}`,
        filename: req.file.originalname,
        userId,
      });

      // Convert PDF buffer to base64 for OpenAI
      const base64Content = req.file.buffer.toString('base64');
      
      // Extract text from PDF using OpenAI
      const pdfText = await extractTextFromPDF(base64Content);
      
      // Analyze the edital and generate study plan
      const analysis = await analyzeEditalPDF(pdfText, examDate);

      // Calculate study period
      const startDate = new Date();
      const endDate = new Date(examDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysUntilExam = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Calculate average hours per day
      const totalEstimatedHours = Object.values(analysis.studyRecommendations.estimatedHoursPerSubject)
        .reduce((sum, hours) => sum + hours, 0);
      const hoursPerDay = Math.ceil(totalEstimatedHours / daysUntilExam);

      // Create the AI-generated schedule
      const scheduleData = {
        userId,
        title: title || `Cronograma - ${analysis.subjects.join(', ')}`,
        description: `Cronograma gerado automaticamente baseado no edital. ${daysUntilExam} dias até o concurso.`,
        subjects: analysis.subjects,
        startDate: startDate.toISOString().split('T')[0],
        endDate: examDate,
        hoursPerDay: Math.min(hoursPerDay, 12), // Máximo 12h por dia
        examDate,
        editalPdfId: editalPdf.id,
        weeklyPlan: analysis.studyRecommendations.weeklyDistribution,
        isAiGenerated: true,
      };

      const schedule = await storage.createSchedule(scheduleData);
      
      res.json({
        schedule,
        analysis: {
          subjects: analysis.subjects,
          topics: analysis.topics,
          daysUntilExam,
          totalEstimatedHours,
          editalPdf,
        }
      });

    } catch (error) {
      console.error("Erro na geração de cronograma por IA:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao gerar cronograma com IA"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
