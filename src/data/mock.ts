import { Course, Lesson } from '../types';

export const mockCourses: Course[] = [
  { id: 'c1', name: '小学数学三年级上册', grade: '三年级', subject: '数学', term: '2026秋季' },
  { id: 'c2', name: '小学数学四年级上册', grade: '四年级', subject: '数学', term: '2026秋季' },
];

const now = new Date();
const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1);
const inThreeDays = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);
const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1);

export const mockLessons: Lesson[] = [
  {
    id: 'l1',
    courseId: 'c1',
    title: '第一单元：时、分、秒',
    classTime: tomorrow.toISOString(),
    status: 'in_progress',
    tasks: [
      { id: 't1', title: '教学目标已撰写', completed: true },
      { id: 't2', title: '教学PPT已上传', completed: false },
      { id: 't3', title: '随堂练习题已准备', completed: false },
      { id: 't3_1', title: '教具已准备（钟表模型）', completed: false },
    ],
    attachments: [
      { id: 'a1', name: '时分秒教案.docx', type: 'document' }
    ],
    prepTime: 25,
  },
  {
    id: 'l2',
    courseId: 'c1',
    title: '第二单元：万以内的加法和减法（一）',
    classTime: inThreeDays.toISOString(),
    status: 'not_started',
    tasks: [
      { id: 't4', title: '教学目标已撰写', completed: false },
      { id: 't5', title: '教学PPT已上传', completed: false },
      { id: 't6', title: '随堂练习题已准备', completed: false },
    ],
    attachments: [],
    prepTime: 0,
  },
  {
    id: 'l3',
    courseId: 'c2',
    title: '第一单元：大数的认识',
    classTime: yesterday.toISOString(),
    status: 'completed',
    tasks: [
      { id: 't7', title: '教学目标已撰写', completed: true },
      { id: 't8', title: '教学PPT已上传', completed: true },
      { id: 't9', title: '随堂练习题已准备', completed: true },
    ],
    attachments: [
      { id: 'a2', name: '大数的认识PPT.pptx', type: 'presentation' },
      { id: 'a3', name: '课后作业.pdf', type: 'document' }
    ],
    prepTime: 45,
  }
];
