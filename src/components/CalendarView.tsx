import React, { useState } from 'react';
import { Lesson, Course, UserSettings } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Circle, Plus, X, Clock } from 'lucide-react';
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
    const timeStr = !isNaN(d.getTime()) 
      ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      : settings.timetableSlots?.[0]?.startTime || '08:00';
    const isSpecial = settings.timetableSlots && settings.timetableSlots.length > 0 && !settings.timetableSlots.some(slot => slot.startTime === timeStr);
    
    setLessonFormData({
      courseId: lesson.courseId || '',
      title: lesson.title || '',
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
    let classTime = new Date(selectedLesson.classTime);
    if (isNaN(classTime.getTime())) {
      classTime = new Date(selectedDate || new Date());
    }
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">备课本日历</h1>
          <p className="text-gray-500 mt-2">全局掌控教学节奏，点击日期可直接添加排课</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-base font-medium text-gray-900 min-w-[100px] text-center">
            {year}年 {month + 1}月
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/80">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="py-4 text-center text-sm font-semibold text-gray-500">
              周{day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[140px]">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="border-b border-r border-gray-100 bg-gray-50/30"></div>
          ))}
          {days.map(day => {
            const dayLessons = getLessonsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            
            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`border-b border-r border-gray-100 p-3 transition-all hover:bg-blue-50/30 cursor-pointer group relative ${isToday ? 'bg-blue-50/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-gray-700 group-hover:text-blue-600'}`}>
                    {day}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-sm border border-gray-100">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1.5 overflow-y-auto max-h-[85px] pr-1 scrollbar-hide">
                  {dayLessons.map(lesson => {
                    const course = courses.find(c => c.id === lesson.courseId);
                    const isUrgent = formatTimeUntil(lesson.classTime, settings.reminderHours).isUrgent && lesson.status !== 'completed';
                    
                    return (
                      <div 
                        key={lesson.id} 
                        onClick={(e) => handleLessonClick(e, lesson)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg truncate flex items-center gap-1.5 border hover:shadow-sm transition-all hover:-translate-y-0.5 ${
                          lesson.status === 'completed' ? 'bg-green-50 border-green-100 text-green-700' :
                          isUrgent ? 'bg-red-50 border-red-100 text-red-700' :
                          'bg-blue-50 border-blue-100 text-blue-700'
                        }`}
                        title={`${course?.name} - ${lesson.title}`}
                      >
                        {lesson.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : isUrgent ? (
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium">{lesson.title}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                添加排课 ({selectedDate.getMonth() + 1}月{selectedDate.getDate()}日)
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">选择课程</label>
                <select 
                  required
                  value={lessonFormData.courseId}
                  onChange={e => setLessonFormData({...lessonFormData, courseId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm bg-white"
                >
                  <option value="">请选择课程...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">课时标题</label>
                <input 
                  type="text" 
                  required
                  value={lessonFormData.title}
                  onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})}
                  placeholder="例如：第三单元：测量"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">上课时间段</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {settings.timetableSlots?.map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setLessonFormData({...lessonFormData, time: slot.startTime, isSpecialTime: false})}
                      className={`p-3 text-sm rounded-xl border transition-all duration-200 ${
                        lessonFormData.time === slot.startTime && !lessonFormData.isSpecialTime 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{slot.name}</div>
                      <div className="text-xs opacity-70 mt-1">{slot.startTime}</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLessonFormData({...lessonFormData, isSpecialTime: true})}
                    className={`p-3 text-sm rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
                      lessonFormData.isSpecialTime 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-600'
                    }`}
                  >
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">自定义时间</span>
                  </button>
                </div>
                
                {lessonFormData.isSpecialTime && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input 
                      type="time" 
                      required
                      value={lessonFormData.time}
                      onChange={e => setLessonFormData({...lessonFormData, time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">编辑排课</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">选择课程</label>
                <select 
                  required
                  value={lessonFormData.courseId}
                  onChange={e => setLessonFormData({...lessonFormData, courseId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm bg-white"
                >
                  <option value="">请选择课程...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">课时标题</label>
                <input 
                  type="text" 
                  required
                  value={lessonFormData.title}
                  onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">上课时间段</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {settings.timetableSlots?.map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setLessonFormData({...lessonFormData, time: slot.startTime, isSpecialTime: false})}
                      className={`p-3 text-sm rounded-xl border transition-all duration-200 ${
                        lessonFormData.time === slot.startTime && !lessonFormData.isSpecialTime 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{slot.name}</div>
                      <div className="text-xs opacity-70 mt-1">{slot.startTime}</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLessonFormData({...lessonFormData, isSpecialTime: true})}
                    className={`p-3 text-sm rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
                      lessonFormData.isSpecialTime 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-600'
                    }`}
                  >
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">自定义时间</span>
                  </button>
                </div>
                
                {lessonFormData.isSpecialTime && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input 
                      type="time" 
                      required
                      value={lessonFormData.time}
                      onChange={e => setLessonFormData({...lessonFormData, time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>
              <div className="pt-6 flex justify-between gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    if (window.confirm('确定要删除这个课时吗？')) {
                      onDeleteLesson(selectedLesson.id);
                      setIsEditModalOpen(false);
                    }
                  }}
                  className="px-6 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-sm font-semibold transition-all"
                >
                  删除课时
                </button>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold transition-all"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
