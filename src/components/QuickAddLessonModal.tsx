import React, { useState } from 'react';
import { Course, Lesson } from '../types';
import { X, Plus } from 'lucide-react';

interface QuickAddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
}

export default function QuickAddLessonModal({ isOpen, onClose, courses, onAddLesson }: QuickAddLessonModalProps) {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [classTime, setClassTime] = useState(new Date().toISOString().slice(0, 16));
  const [lessonType, setLessonType] = useState<Lesson['lessonType']>('新授课');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;

    onAddLesson({
      courseId,
      title: title.trim(),
      classTime: new Date(classTime).toISOString(),
      status: 'not_started',
      tasks: [],
      attachments: [],
      lessonType,
      prepTime: 0
    });
    
    setTitle('');
    setLessonType('新授课');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">快速添加课时</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属课程</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              <option value="" disabled>选择课程...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">课时标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：第一单元 第一课"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
              <input
                type="datetime-local"
                value={classTime}
                onChange={(e) => setClassTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">课型</label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value as Lesson['lessonType'])}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="新授课">新授课</option>
                <option value="复习课">复习课</option>
                <option value="讲评课">讲评课</option>
                <option value="实验课">实验课</option>
                <option value="公开课">公开课</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !courseId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
