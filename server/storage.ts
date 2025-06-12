import { 
  users, 
  studySchedules, 
  studySessions, 
  pdfDocuments,
  type User, 
  type InsertUser, 
  type StudySchedule, 
  type InsertStudySchedule,
  type StudySession,
  type InsertStudySession,
  type PdfDocument,
  type InsertPdfDocument
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Schedule methods
  getSchedulesByUserId(userId: number): Promise<StudySchedule[]>;
  getSchedule(id: number): Promise<StudySchedule | undefined>;
  createSchedule(schedule: InsertStudySchedule & { userId: number }): Promise<StudySchedule>;
  updateSchedule(id: number, schedule: Partial<StudySchedule>): Promise<StudySchedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;

  // Study session methods
  getSessionsByUserId(userId: number): Promise<StudySession[]>;
  createSession(session: InsertStudySession & { userId: number }): Promise<StudySession>;
  getRecentSessions(userId: number, limit: number): Promise<StudySession[]>;

  // PDF document methods
  getPdfsByUserId(userId: number): Promise<PdfDocument[]>;
  getPdf(id: number): Promise<PdfDocument | undefined>;
  createPdf(pdf: InsertPdfDocument & { userId: number }): Promise<PdfDocument>;
  updatePdf(id: number, pdf: Partial<PdfDocument>): Promise<PdfDocument | undefined>;
  deletePdf(id: number): Promise<boolean>;

  // Stats methods
  getUserStats(userId: number): Promise<{
    totalHours: number;
    completedSessions: number;
    currentStreak: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private schedules: Map<number, StudySchedule>;
  private sessions: Map<number, StudySession>;
  private pdfs: Map<number, PdfDocument>;
  private currentUserId: number;
  private currentScheduleId: number;
  private currentSessionId: number;
  private currentPdfId: number;

  constructor() {
    this.users = new Map();
    this.schedules = new Map();
    this.sessions = new Map();
    this.pdfs = new Map();
    this.currentUserId = 1;
    this.currentScheduleId = 1;
    this.currentSessionId = 1;
    this.currentPdfId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSchedulesByUserId(userId: number): Promise<StudySchedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.userId === userId
    );
  }

  async getSchedule(id: number): Promise<StudySchedule | undefined> {
    return this.schedules.get(id);
  }

  async createSchedule(scheduleData: any): Promise<StudySchedule> {
    const id = this.currentScheduleId++;
    const schedule: StudySchedule = {
      id,
      userId: scheduleData.userId,
      title: scheduleData.title,
      description: scheduleData.description || null,
      subjects: Array.isArray(scheduleData.subjects) ? scheduleData.subjects : [],
      startDate: scheduleData.startDate,
      endDate: scheduleData.endDate,
      hoursPerDay: scheduleData.hoursPerDay,
      createdAt: new Date().toISOString(),
      examDate: scheduleData.examDate || null,
      editalPdfId: scheduleData.editalPdfId || null,
      weeklyPlan: scheduleData.weeklyPlan || null,
      isAiGenerated: scheduleData.isAiGenerated || false,
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<StudySchedule>): Promise<StudySchedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updated = { ...schedule, ...updates };
    this.schedules.set(id, updated);
    return updated;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async getSessionsByUserId(userId: number): Promise<StudySession[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId
    );
  }

  async createSession(sessionData: InsertStudySession & { userId: number }): Promise<StudySession> {
    const id = this.currentSessionId++;
    const session: StudySession = {
      ...sessionData,
      id,
      completedAt: new Date().toISOString(),
      scheduleId: sessionData.scheduleId || null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getRecentSessions(userId: number, limit: number): Promise<StudySession[]> {
    const sessions = await this.getSessionsByUserId(userId);
    return sessions
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit);
  }

  async getPdfsByUserId(userId: number): Promise<PdfDocument[]> {
    return Array.from(this.pdfs.values()).filter(
      (pdf) => pdf.userId === userId
    );
  }

  async getPdf(id: number): Promise<PdfDocument | undefined> {
    return this.pdfs.get(id);
  }

  async createPdf(pdfData: InsertPdfDocument & { userId: number }): Promise<PdfDocument> {
    const id = this.currentPdfId++;
    const pdf: PdfDocument = {
      ...pdfData,
      id,
      uploadedAt: new Date().toISOString(),
      lastReadPage: 1,
    };
    this.pdfs.set(id, pdf);
    return pdf;
  }

  async updatePdf(id: number, updates: Partial<PdfDocument>): Promise<PdfDocument | undefined> {
    const pdf = this.pdfs.get(id);
    if (!pdf) return undefined;
    
    const updated = { ...pdf, ...updates };
    this.pdfs.set(id, updated);
    return updated;
  }

  async deletePdf(id: number): Promise<boolean> {
    return this.pdfs.delete(id);
  }

  async getUserStats(userId: number): Promise<{
    totalHours: number;
    completedSessions: number;
    currentStreak: number;
  }> {
    const sessions = await this.getSessionsByUserId(userId);
    
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = Math.round(totalMinutes / 60);
    const completedSessions = sessions.length;
    
    // Calculate streak (simplified - consecutive days with sessions)
    const sessionDates = sessions.map(s => new Date(s.completedAt).toDateString());
    const uniqueDatesArray = Array.from(new Set(sessionDates)).sort();
    
    let currentStreak = 0;
    const today = new Date().toDateString();
    let checkDate = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dateStr = checkDate.toDateString();
      if (uniqueDatesArray.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalHours,
      completedSessions,
      currentStreak,
    };
  }
}

export const storage = new MemStorage();
