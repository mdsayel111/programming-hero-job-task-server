import { db } from '../../prisma/db.ts';
import { AppError } from '../../middlewares/errorHandler.ts';
import type {
  CreateSubmissionInput,
  UpdateSubmissionStatusInput,
  QuerySubmissionInput,
} from './submission.validation.ts';

export class SubmissionService {
  /**
   * Create a new project submission (Student view)
   * Enforces duplicate submission prevention:
   * 1. Checks if the student already submitted with the same repo URL
   * 2. Checks if the student already submitted with the same project name
   */
  async createSubmission(studentId: number, data: CreateSubmissionInput) {
    // Check duplicate repo URL for this student
    const duplicateRepo = await db.orm.public.Submission
      .where((s) => s.studentId.eq(studentId))
      .where((s) => s.repoUrl.eq(data.repoUrl))
      .first();

    if (duplicateRepo) {
      throw new AppError(
        'Duplicate submission: You have already submitted a project with this GitHub repository URL.',
        409
      );
    }

    // Check duplicate project name for this student
    const duplicateName = await db.orm.public.Submission
      .where((s) => s.studentId.eq(studentId))
      .where((s) => s.projectName.eq(data.projectName))
      .first();

    if (duplicateName) {
      throw new AppError(
        'Duplicate submission: You already have a submission with this project name.',
        409
      );
    }

    // Insert new submission
    const submission = await db.orm.public.Submission.create({
      projectName: data.projectName,
      repoUrl: data.repoUrl,
      liveLink: data.liveLink,
      description: data.description,
      status: 'PENDING',
      studentId: studentId,
    });

    return submission;
  }

  /**
   * Get all submissions belonging to the logged-in student
   */
  async getMySubmissions(studentId: number) {
    const submissions = await db.orm.public.Submission
      .where((s) => s.studentId.eq(studentId))
      .orderBy((s) => s.createdAt.desc())
      .all();

    return submissions;
  }

  /**
   * Get paginated submissions with server-side filters (Mentor view)
   */
  async getAllSubmissions(query: QuerySubmissionInput) {
    const { page, limit, status, search } = query;
    const offset = (page - 1) * limit;

    // Build query collections
    let queryBuilder = db.orm.public.Submission.include('student', (s) =>
      s.select('id', 'name', 'email')
    );
    let countQuery = db.orm.public.Submission;

    if (status && status !== 'ALL') {
      queryBuilder = queryBuilder.where((s) => s.status.eq(status));
      countQuery = countQuery.where((s) => s.status.eq(status));
    }

    if (search && search.length > 0) {
      const searchTerm = `%${search}%`;
      queryBuilder = queryBuilder.where((s) => s.projectName.ilike(searchTerm));
      countQuery = countQuery.where((s) => s.projectName.ilike(searchTerm));
    }

    // Total count for pagination
    const countResult = await countQuery.aggregate((a) => ({
      total: a.count(),
    }));
    const total = countResult.total ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch items with pagination and sorting (newest first)
    const items = await queryBuilder
      .orderBy((s) => s.createdAt.desc())
      .limit(limit)
      .offset(offset)
      .all();

    return {
      submissions: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update submission status (Approve / Reject) with optional mentor feedback
   */
  async updateStatus(submissionId: number, data: UpdateSubmissionStatusInput) {
    const existing = await db.orm.public.Submission
      .where((s) => s.id.eq(submissionId))
      .first();

    if (!existing) {
      throw new AppError('Submission not found', 404);
    }

    const updated = await db.orm.public.Submission
      .where((s) => s.id.eq(submissionId))
      .update({
        status: data.status,
        feedback: data.feedback !== undefined ? data.feedback : existing.feedback,
      });

    return updated;
  }

  /**
   * Get aggregated statistics for the mentor review dashboard
   */
  async getStats() {
    const totalAll = await db.orm.public.Submission.aggregate((a) => ({
      count: a.count(),
    }));

    const totalPending = await db.orm.public.Submission
      .where((s) => s.status.eq('PENDING'))
      .aggregate((a) => ({ count: a.count() }));

    const totalApproved = await db.orm.public.Submission
      .where((s) => s.status.eq('APPROVED'))
      .aggregate((a) => ({ count: a.count() }));

    const totalRejected = await db.orm.public.Submission
      .where((s) => s.status.eq('REJECTED'))
      .aggregate((a) => ({ count: a.count() }));

    return {
      total: totalAll.count ?? 0,
      pending: totalPending.count ?? 0,
      approved: totalApproved.count ?? 0,
      rejected: totalRejected.count ?? 0,
    };
  }
}

export const submissionService = new SubmissionService();
