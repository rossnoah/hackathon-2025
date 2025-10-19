export interface AppUsage {
  appName: string;
  usageMinutes: number;
}

export interface AssignmentInput {
  id?: string;
  courseId?: string;
  title?: string;
  course?: string;
  date?: string;
  time?: string;
  description?: string;
  actionUrl?: string;
  type?: string;
  component?: string;
}

export interface ScreentimeInput {
  email: string;
  appUsage: AppUsage[];
  date?: string;
}

export interface NotificationInput {
  title: string;
  body: string;
  data?: Record<string, any>;
  email?: string;
}

export interface RegisterUserInput {
  email: string;
  pushToken?: string;
  notificationsEnabled?: boolean;
}
