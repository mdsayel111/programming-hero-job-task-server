import type { Request, Response, NextFunction } from 'express';
import { submissionService } from './submission.service.ts';
import {
  createSubmissionSchema,
  updateSubmissionStatusSchema,
  querySubmissionSchema,
} from './submission.validation.ts';

export class SubmissionController {
  /**
   * POST /api/submissions - Create a new project submission
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const validatedData = createSubmissionSchema.parse(req.body);

      const submission = await submissionService.createSubmission(studentId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Project submitted successfully!',
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/my - Get current student's own submissions
   */
  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const submissions = await submissionService.getMySubmissions(studentId);

      res.status(200).json({
        success: true,
        data: { submissions },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions - Get all submissions with pagination & server-side filter
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = querySubmissionSchema.parse(req.query);
      const result = await submissionService.getAllSubmissions(validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/submissions/:id/status - Update approval / rejection status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const submissionId = parseInt(req.params.id as string, 10);
      const validatedData = updateSubmissionStatusSchema.parse(req.body);

      const updated = await submissionService.updateStatus(submissionId, validatedData);

      res.status(200).json({
        success: true,
        message: `Project marked as ${validatedData.status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/stats - Get aggregated review statistics
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await submissionService.getStats();

      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();
