import React, { useState } from 'react';
import { Lesson, Course, UserSettings } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Circle, Plus, X } from 'lucide-react';
import { formatTimeUntil } from '../utils/dateUtils';

interface CalendarViewProps {
  lessons: Lesson[];
  courses: Course[];
  settings: UserSettings;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
}

export default function CalendarView({ lessons, courses, settings, onAddLesson, onUpdateLesson, onDeleteLesson }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [lessonFormData, setLessonFormData] = useState({
    courseId: '',
    title: '',
    time: settings.timetableSlots?.[0]?.startTime || '08:00',
    isSpecialTime: false
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);

  const getLessonsForDay = (day: number) => {
    return lessons.filter(l => {
      const d = new Date(l.classTime);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.classTime).getTime() - new Date(b.classTime).getTime());
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setLessonFormData({ courseId: '', title: '', time: settings.timetableSlots?.[0]?.startTime || '08:00', isSpecialTime: false });
    setIsAddModalOpen(true);
  };

  const handleLessonClick = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setSelectedLesson(lesson);
    const d = new Date(lesson.classTime);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const isSpecial = settings.timetableSlots && settings.timetableSlots.length > 0 && !settings.timetableSlots.some(slot => slot.startTime === timeStr);
    
    setLessonFormData({
      courseId: lesson.courseId,
      title: lesson.title,
      time: timeStr,
      isSpecialTime: !!isSpecial
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !lessonFormData.courseId || !lessonFormData.title || !lessonFormData.time) return;

    const [hours, minutes] = lessonFormData.time.split(':');
    const classTime = new Date(selectedDate);
    classTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    onAddLesson({
      courseId: lessonFormData.courseId,
      title: lessonFormData.title,
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

    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson || !lessonFormData.courseId || !lessonFormData.title || !lessonFormData.time) return;

    const [hours, minutes] = lessonFormData.time.split(':');
    const classTime = new Date(selectedLesson.classTime);
    classTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    onUpdateLesson({
      ...selectedLesson,
      courseId: lessonFormData.courseId,
      title: lessonFormData.title,
      classTime: classTime.toISOString()
    });

    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">备课本日历</h1>
          <p className="text-gray-500 mt-1">全局掌控教学节奏，点击日期可直接添加排课</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-base font-medium text-gray-900 min-w-[100px] text-center">
            {year}年 {month + 1}月
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
              周{day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="border-b border-r border-gray-100 bg-gray-50/50"></div>
          ))}
          {days.map(day => {
            const dayLessons = getLessonsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            
            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`border-b border-r border-gray-100 p-2 transition-colors hover:bg-gray-50 cursor-pointer group relative ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[75px] pr-1 scrollbar-hide">
                  {dayLessons.map(lesson => {
                    const course = courses.find(c => c.id === lesson.courseId);
                    const isUrgent = formatTimeUntil(lesson.classTime, settings.reminderHours).isUrgent && lesson.status !== 'completed';
                    
                    return (
                      <div 
                        key={lesson.id} 
                        onClick={(e) => handleLessonClick(e, lesson)}
                        className={`text-xs px-2 py-1 rounded truncate flex items-center gap-1 border hover:opacity-80 transition-opacity ${
                          lesson.status === 'completed' ? 'bg-green-50 border-green-100 text-green-700' :
                          isUrgent ? 'bg-red-50 border-red-100 text-red-700' :
                          'bg-blue-50 border-blue-100 text-blue-700'
                        }`}
                        title={`${course?.name} - ${lesson.title}`}
                      >
                        {lesson.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        ) : isUrgent ? (
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lesson Modal */}
      {isAddModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                添加排课 ({selectedDate.getMonth() + 1}月{selectedDate.getDate()}日)
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
                <select 
                  required
                  value={lessonFormData.courseId}
                  onChange={e => setLessonFormData({...lessonFormData, courseId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择课程...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课时标题</label>
                <input 
                  type="text" 
                  required
                  value={lessonFormData.title}
                  onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})}
                  placeholder="例如：第三单元：测量"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上课时间段</label>
                {settings.timetableSlots && settings.timetableSlots.length > 0 && !lessonFormData.isSpecialTime ? (
                  <select 
                    required
                    value={lessonFormData.time}
                    onChange={e => {
                      if (e.target.value === 'special') {
                        setLessonFormData({...lessonFormData, isSpecialTime: true, time: '12:00'});
                      } else {
                        setLessonFormData({...lessonFormData, time: e.target.value});
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
                      value={lessonFormData.time}
                      onChange={e => setLessonFormData({...lessonFormData, time: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {settings.timetableSlots && settings.timetableSlots.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setLessonFormData({...lessonFormData, isSpecialTime: false, time: settings.timetableSlots?.[0]?.startTime || '08:00'})}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        返回预设
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
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

      {/* Edit Lesson Modal */}
      {isEditModalOpen && selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">编辑排课</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
                <select 
                  required
                  value={lessonFormData.courseId}
                  onChange={e => setLessonFormData({...lessonFormData, courseId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择课程...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课时标题</label>
                <input 
                  type="text" 
                  required
                  value={lessonFormData.title}
                  onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上课时间段</label>
                {settings.timetableSlots && settings.timetableSlots.length > 0 && !lessonFormData.isSpecialTime ? (
                  <select 
                    required
                    value={lessonFormData.time}
                    onChange={e => {
                      if (e.target.value === 'special') {
                        setLessonFormData({...lessonFormData, isSpecialTime: true, time: '12:00'});
                      } else {
                        setLessonFormData({...lessonFormData, time: e.target.value});
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
                      value={lessonFormData.time}
                      onChange={e => setLessonFormData({...lessonFormData, time: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {settings.timetableSlots && settings.timetableSlots.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setLessonFormData({...lessonFormData, isSpecialTime: false, time: settings.timetableSlots?.[0]?.startTime || '08:00'})}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        返回预设
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-between gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    if (window.confirm('确定要删除这个课时吗？')) {
                      onDeleteLesson(selectedLesson.id);
                      setIsEditModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                >
                  删除课时
                </button>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
