import prisma from '../config/database';
import { AssignmentInput } from '../types';
import userService from './user.service';

export class AssignmentService {
  async storeAssignments(
    email: string,
    assignments: AssignmentInput[],
    extractedAt?: string
  ) {
    // Ensure user exists
    const userCreated = await userService.ensureUserExists(email);
    if (!userCreated) {
      throw new Error('Failed to create/update user');
    }

    // Delete old assignments for this user
    await prisma.assignment.deleteMany({
      where: { email },
    });

    // Insert new assignments
    const extractedDate = extractedAt ? new Date(extractedAt) : new Date();

    const assignmentData = assignments.map((a) => ({
      id: `${email}-${a.id || Date.now()}-${Math.random()}`,
      email,
      courseId: a.courseId || null,
      title: a.title || null,
      course: a.course || null,
      date: a.date || null,
      time: a.time || null,
      description: a.description || null,
      actionUrl: a.actionUrl || null,
      type: a.type || null,
      component: a.component || null,
      extractedAt: extractedDate,
    }));

    await prisma.assignment.createMany({
      data: assignmentData,
    });

    return { count: assignments.length, success: true };
  }

  async getAssignments(email?: string) {
    const where = email ? { email } : {};

    return prisma.assignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssignmentsByEmail(email: string) {
    return prisma.assignment.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new AssignmentService();
