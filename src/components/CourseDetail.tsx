import React, { useState } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import LessonCard from './LessonCard';
import { BookOpen, Plus, X } from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  lessons: Lesson[];
  settings: UserSettings;
  onUpdateLesson: (lesson: Lesson) => void;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onDeleteLesson: (id: string) => void;
}

export default function CourseDetail({ course, lessons, settings, onUpdateLesson, onAddLesson, onDeleteLesson }: CourseDetailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(settings.timetableSlots?.[0]?.startTime || '08:00');
  const [isSpecialTime, setIsSpecialTime] = useState(false);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalCount = lessons.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const sortedLessons = [...lessons].sort((a, b) => new Date(a.classTime).getTime() - new Date(b.classTime).getTime());

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime) return;
    
    const [hours, minutes] = newTime.split(':');
    const classTime = new Date(newDate);
    classTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    onAddLesson({
      courseId: course.id,
      title: newTitle,
      classTime: classTime.toISOString(),
      status: 'not_started',
      tasks: settings.defaultTasks.map((title, index) => ({
        id: `t_${Date.now()}_${index}`,
        title,
        completed: false
      })),
      attachments: [],
      prepTime: 0
    });
    
    setIsModalOpen(false);
    setNewTitle('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime(settings.timetableSlots?.[0]?.startTime || '08:00');
    setIsSpecialTime(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      {/* Course Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
              <BookOpen className="w-4 h-4" />
              {course.subject} · {course.grade}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-gray-500 mt-2">{course.term}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            添加课时
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">备课总进度</span>
              <span className="text-gray-900 font-bold">{completedCount} / {totalCount}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {sortedLessons.map(lesson => (
          <LessonCard 
            key={lesson.id} 
            lesson={lesson} 
            course={course}
            settings={settings}
            onUpdate={onUpdateLesson} 
            onDelete={() => onDeleteLesson(lesson.id)}
          />
        ))}
        {sortedLessons.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
            暂无课时，点击右上角添加
          </div>
        )}
      </div>

      {/* Add Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">添加新课时</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课时标题</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="例如：第三单元：测量"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上课日期</label>
                  <input 
                    type="date" 
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上课时间段</label>
                  {settings.timetableSlots && settings.timetableSlots.length > 0 && !isSpecialTime ? (
                    <select 
                      required
                      value={newTime}
                      onChange={e => {
                        if (e.target.value === 'special') {
                          setIsSpecialTime(true);
                          setNewTime('12:00');
                        } else {
                          setNewTime(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择时间段...</option>
                      {settings.timetableSlots.map(slot => (
                        <option key={slot.id} value={slot.startTime}>{slot.name} ({slot.startTime} - {slot.endTime})</option>
                      ))}
                      <option value="special">特殊时间...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="time" 
                        required
                        value={newTime}
                        onChange={e => setNewTime(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {settings.timetableSlots && settings.timetableSlots.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSpecialTime(false);
                            setNewTime(settings.timetableSlots?.[0]?.startTime || '08:00');
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                        >
                          返回预设
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  确定添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
