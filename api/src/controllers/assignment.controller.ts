import { Request, Response } from 'express';
import assignmentService from '../services/assignment.service';
import { logger } from '../utils/logger';

export class AssignmentController {
  async storeAssignments(req: Request, res: Response) {
    const { assignments: newAssignments, extractedAt, email } = req.body;

    if (!newAssignments || !Array.isArray(newAssignments)) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await assignmentService.storeAssignments(
        email,
        newAssignments,
        extractedAt
      );

      logger.success(`Received ${result.count} assignments for ${email}`);

      return res.json({
        success: true,
        message: `Received ${result.count} assignments`,
        count: result.count,
      });
    } catch (error) {
      logger.error('Error storing assignments:', error);
      return res.status(500).json({ error: 'Failed to store assignments' });
    }
  }

  async getAssignments(req: Request, res: Response) {
    try {
      const { email } = req.query;
      const assignments = await assignmentService.getAssignments(email as string | undefined);

      return res.json({ count: assignments.length, assignments });
    } catch (error) {
      logger.error('Error fetching assignments:', error);
      return res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  }
}

export default new AssignmentController();
