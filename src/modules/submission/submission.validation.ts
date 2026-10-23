import { z } from 'zod';

export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters'),
  repoUrl: z
    .string()
    .trim()
    .url('Repository URL must be a valid URL')
    .refine(
      (url) => /^https?:\/\/(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/.+/i.test(url),
      {
        message: 'Repository URL must be a valid GitHub, GitLab, or Bitbucket repository URL',
      }
    ),
  liveLink: z
    .string()
    .trim()
    .url('Live link must be a valid URL (starting with http:// or https://)'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(2000, 'Description must not exceed 2000 characters'),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: "Status must be either 'APPROVED' or 'REJECTED'" }),
  }),
  feedback: z.string().trim().max(1000, 'Feedback must not exceed 1000 characters').optional(),
});

export const querySubmissionSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED']).default('ALL'),
  search: z.string().trim().optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
export type QuerySubmissionInput = z.infer<typeof querySubmissionSchema>;
