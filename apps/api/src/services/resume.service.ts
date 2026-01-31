import { Resume, IResume } from "../models/resume.model.js";
import { generatePDF as generatePdfService } from "./pdf.service.js"; // Alias to avoid naming conflict
import mongoose from "mongoose";

export class ResumeService {
  /**
   * Find all resumes for a user
   */
  async findAll(userId: string) {
    return await Resume.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Find a single resume by ID and User ID
   */
  async findById(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid resume ID"); // Controller should catch this
    }
    return await Resume.findOne({ _id: id, userId });
  }

  /**
   * Create a new resume
   */
  async create(data: Partial<IResume>, userId: string) {
    return await Resume.create({
      ...data,
      userId,
    });
  }

  /**
   * Update a resume
   */
  async update(id: string, userId: string, data: Partial<IResume>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid resume ID");
    }
    return await Resume.findOneAndUpdate(
      { _id: id, userId },
      { ...data },
      { new: true, runValidators: true },
    );
  }

  /**
   * Delete a resume
   */
  async delete(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid resume ID");
    }
    return await Resume.findOneAndDelete({ _id: id, userId });
  }

  /**
   * Generate PDF for a resume
   */
  async generatePdf(id: string, userId: string) {
    const resume = await this.findById(id, userId);
    if (!resume) {
      throw new Error("Resume not found");
    }
    // Call the existing PDF generation service
    return await generatePdfService(resume);
  }
}

export const resumeService = new ResumeService();
