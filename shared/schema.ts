import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const studySchedules = pgTable("study_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  subjects: json("subjects").$type<string[]>().notNull(),
  startDate: text("start_date").notNull(), // ISO date string
  endDate: text("end_date").notNull(), // ISO date string
  hoursPerDay: integer("hours_per_day").notNull(),
  createdAt: text("created_at").notNull(),
  examDate: text("exam_date"), // Data da prova
  editalPdfId: integer("edital_pdf_id"), // Referência ao PDF do edital
  weeklyPlan: json("weekly_plan").$type<{
    [day: string]: {
      subject: string;
      topics: string[];
      hours: number;
    }[];
  }>(), // Plano semanal gerado pela IA
  isAiGenerated: boolean("is_ai_generated").default(false), // Indica se foi gerado por IA
});

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scheduleId: integer("schedule_id"),
  subject: text("subject").notNull(),
  duration: integer("duration").notNull(), // minutes
  completedAt: text("completed_at").notNull(), // ISO date string
});

export const pdfDocuments = pgTable("pdf_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  lastReadPage: integer("last_read_page").default(1),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertStudyScheduleSchema = createInsertSchema(studySchedules).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Schema específico para criação de cronograma via IA
export const aiScheduleSchema = z.object({
  examDate: z.string().min(1, "Data do concurso é obrigatória"),
  editalPdfFile: z.any(), // Para o upload do PDF
  title: z.string().optional(),
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  userId: true,
  completedAt: true,
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocuments).omit({
  id: true,
  userId: true,
  uploadedAt: true,
  lastReadPage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStudySchedule = z.infer<typeof insertStudyScheduleSchema>;
export type StudySchedule = typeof studySchedules.$inferSelect;

export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
export type PdfDocument = typeof pdfDocuments.$inferSelect;
