import React, { useState } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import { ChevronLeft, ChevronRight, Clock, Plus, Coffee, Sun, Music, BookOpen, X, Copy, Download, Printer } from 'lucide-react';
import { motion } from 'motion/react';

interface ScheduleViewProps {
  lessons: Lesson[];
  courses: Course[];
  settings: UserSettings;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onAddMultipleLessons?: (lessons: Lesson[]) => void;
  onDeleteLesson: (id: string) => void;
}

export default function ScheduleView({ lessons, courses, settings, onAddLesson, onAddMultipleLessons, onDeleteLesson }: ScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [newLessonData, setNewLessonData] = useState({
    courseId: '',
    title: '',
    time: settings.timetableSlots?.[0]?.startTime || '08:00',
    isSpecialTime: false
  });

  // Get week days based on selectedDate
  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date);
    monday.setDate(diff);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDays = getWeekDays(new Date(selectedDate));

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const dayLessons = lessons.filter(l => {
    const d = new Date(l.classTime);
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  }).sort((a, b) => new Date(a.classTime).getTime() - new Date(b.classTime).getTime());

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonData.courseId || !newLessonData.title || !newLessonData.time) return;

    const [hours, minutes] = newLessonData.time.split(':');
    const classTime = new Date(selectedDate);
    classTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    onAddLesson({
      courseId: newLessonData.courseId,
      title: newLessonData.title,
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
    setNewLessonData({ courseId: '', title: '', time: settings.timetableSlots?.[0]?.startTime || '08:00', isSpecialTime: false });
  };

  const handleDuplicateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate || !onAddMultipleLessons || dayLessons.length === 0) return;

    const targetD = new Date(targetDate);
    
    const duplicatedLessons: Lesson[] = dayLessons.map(lesson => {
      const originalTime = new Date(lesson.classTime);
      const newTime = new Date(targetD);
      if (!isNaN(originalTime.getTime())) {
        newTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
      } else {
        newTime.setHours(8, 0, 0, 0);
      }

      return {
        ...lesson,
        id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${lesson.title} (复用)`,
        classTime: newTime.toISOString(),
        status: 'not_started',
        tasks: lesson.tasks.map(t => ({ ...t, completed: false }))
      };
    });

    onAddMultipleLessons(duplicatedLessons);
    setIsDuplicateModalOpen(false);
    setTargetDate('');
    alert('课表已成功复用！');
  };

  const handleExportCSV = () => {
    const headers = ['日期', '时间', '课程', '年级', '课时标题', '课型', '状态'];
    const rows = lessons.map(l => {
      const course = courses.find(c => c.id === l.courseId);
      const d = new Date(l.classTime);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const statusStr = l.status === 'completed' ? '已完成' : l.status === 'in_progress' ? '备课中' : l.status === 'needs_revision' ? '待优化' : '未开始';
      
      return [
        dateStr,
        timeStr,
        course?.name || '-',
        course?.grade || '-',
        l.title,
        l.lessonType || '新授课',
        statusStr
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `课表导出_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">课表排期</h1>
          <p className="text-gray-500 mt-2">集中管理每日课表与时间段</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm print:hidden"
            title="打印课表"
          >
            <Printer className="w-4 h-4" />
            打印
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm print:hidden"
          >
            <Download className="w-4 h-4" />
            导出课表
          </button>
          {dayLessons.length > 0 && (
            <button 
              onClick={() => setIsDuplicateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm print:hidden"
            >
              <Copy className="w-4 h-4" />
              复用本日课表
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md print:hidden"
          >
            <Plus className="w-4 h-4" />
            添加排课
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-200 rounded-xl transition-colors print:hidden">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-lg">
            {weekDays[0].getFullYear()}年{weekDays[0].getMonth() + 1}月
          </span>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-200 rounded-xl transition-colors print:hidden">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {weekDays.map((date, index) => {
            const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
            const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center py-5 transition-all ${
                  isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs font-semibold mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                  {dayNames[index]}
                </span>
                <span className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                  isSelected ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 scale-110' : 
                  isToday ? 'bg-gray-100 text-gray-900 border border-gray-200' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Schedule */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 课表
        </h2>

        {dayLessons.length > 0 ? (
          <div className="space-y-4">
            {dayLessons.map((lesson, index) => {
              const course = courses.find(c => c.id === lesson.courseId);
              const time = new Date(lesson.classTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={lesson.id} className="flex gap-4">
                  <div className="w-20 flex flex-col items-end pt-4 text-gray-500 font-medium">
                    {time}
                  </div>
                  <div className="relative flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-5 z-10 ring-4 ring-white"></div>
                    {index !== dayLessons.length - 1 && (
                      <div className="w-0.5 bg-gray-200 flex-1 absolute top-8 bottom-[-2rem]"></div>
                    )}
                  </div>
                  <div className="flex-1 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                        <BookOpen className="w-4 h-4" />
                        {course?.name} <span className="text-gray-400 font-normal">({course?.grade})</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                        <button 
                          onClick={() => {
                            const newTime = new Date(lesson.classTime);
                            newTime.setDate(newTime.getDate() + 7); // Default to next week
                            const duplicatedLesson: Lesson = {
                              ...lesson,
                              id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                              title: `${lesson.title} (复用)`,
                              classTime: newTime.toISOString(),
                              status: 'not_started',
                              tasks: lesson.tasks.map(t => ({ ...t, completed: false }))
                            };
                            if (onAddMultipleLessons) {
                              onAddMultipleLessons([duplicatedLesson]);
                              alert('已成功复用到下周同一时间！');
                            }
                          }}
                          className="text-gray-500 hover:text-blue-600 flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="复用到下周"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          复用
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('确定要删除这个课时吗？')) {
                              onDeleteLesson(lesson.id);
                            }
                          }}
                          className="text-gray-500 hover:text-red-600 flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="删除课时"
                        >
                          <X className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{lesson.title}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-3 py-1.5 rounded-lg border font-medium ${
                        lesson.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
                        lesson.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                        {lesson.status === 'completed' ? '已完成备课' : 
                         lesson.status === 'in_progress' ? '备课中' : '未开始备课'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-12 text-center border border-orange-100 shadow-sm"
          >
            <div className="flex justify-center gap-4 mb-6">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                <Sun className="w-12 h-12 text-orange-400" />
              </motion.div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}>
                <Coffee className="w-12 h-12 text-amber-600" />
              </motion.div>
              <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }}>
                <Music className="w-12 h-12 text-orange-500" />
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-orange-800 mb-3">今日休息！！</h3>
            <p className="text-orange-600/80 text-lg">
              今天没有排课哦~ 放下粉笔，喝杯咖啡，享受属于自己的惬意时光吧！🌿
            </p>
          </motion.div>
        )}
      </div>

      {/* Add Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">添加排课</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">选择课程</label>
                <select 
                  required
                  value={newLessonData.courseId}
                  onChange={e => setNewLessonData({...newLessonData, courseId: e.target.value})}
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
                  value={newLessonData.title}
                  onChange={e => setNewLessonData({...newLessonData, title: e.target.value})}
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
                      onClick={() => setNewLessonData({...newLessonData, time: slot.startTime, isSpecialTime: false})}
                      className={`p-3 text-sm rounded-xl border transition-all duration-200 ${
                        newLessonData.time === slot.startTime && !newLessonData.isSpecialTime 
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
                    onClick={() => setNewLessonData({...newLessonData, isSpecialTime: true})}
                    className={`p-3 text-sm rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
                      newLessonData.isSpecialTime 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-600'
                    }`}
                  >
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">自定义时间</span>
                  </button>
                </div>
                
                {newLessonData.isSpecialTime && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input 
                      type="time" 
                      required
                      value={newLessonData.time}
                      onChange={e => setNewLessonData({...newLessonData, time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
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

      {/* Duplicate Schedule Modal */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">复用本日课表</h2>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDuplicateSubmit} className="space-y-6">
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl mb-6">
                <p className="text-sm text-blue-800 leading-relaxed">
                  将把 <strong>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日</strong> 的 {dayLessons.length} 节课完整复用到目标日期。
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">选择目标日期</label>
                <input 
                  type="date" 
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  确定复用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
