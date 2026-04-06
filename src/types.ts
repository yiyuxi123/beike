export type Course = {
  id: string;
  name: string;
  grade: string;
  subject: string;
  term: string;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export type Attachment = {
  id: string;
  name: string;
  type: 'document' | 'presentation' | 'video' | 'link';
};

export type LessonStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_revision';

export type LessonType = '新授课' | '复习课' | '讲评课' | '实验课' | '公开课' | '考试' | '活动' | '其他';

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  classTime: string; // ISO string
  status: LessonStatus;
  lessonType?: LessonType;
  tasks: Task[];
  attachments: Attachment[];
  prepTime: number; // minutes
  prepGoal?: string; // 备课目标
  reflection?: string; // 教学反思
};

export type TimetableSlot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

export type UserSettings = {
  soundEnabled: boolean;
  reminderHours: number;
  defaultTasks: string[];
  archiveFolder?: string;
  archiveDirectoryHandle?: any;
  timetableSlots?: TimetableSlot[];
  personalInfo?: {
    name: string;
    title: string;
    school: string;
    avatar?: string;
  };
  quickNote?: string;
};
