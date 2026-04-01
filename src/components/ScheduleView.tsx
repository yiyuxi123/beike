import React, { useState } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import { ChevronLeft, ChevronRight, Clock, Plus, Coffee, Sun, Music, BookOpen, X, Copy } from 'lucide-react';
import { motion } from 'motion/react';

interface ScheduleViewProps {
  lessons: Lesson[];
  courses: Course[];
  settings: UserSettings;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onAddMultipleLessons?: (lessons: Lesson[]) => void;
}

export default function ScheduleView({ lessons, courses, settings, onAddLesson, onAddMultipleLessons }: ScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [newLessonData, setNewLessonData] = useState({
    courseId: '',
    title: '',
    time: settings.timetableSlots?.[0]?.startTime || '08:00'
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
    setNewLessonData({ courseId: '', title: '', time: settings.timetableSlots?.[0]?.startTime || '08:00' });
  };

  const handleDuplicateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate || !onAddMultipleLessons || dayLessons.length === 0) return;

    const targetD = new Date(targetDate);
    
    const duplicatedLessons: Lesson[] = dayLessons.map(lesson => {
      const originalTime = new Date(lesson.classTime);
      const newTime = new Date(targetD);
      newTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);

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

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课表排期</h1>
          <p className="text-gray-500 mt-1">集中管理每日课表与时间段</p>
        </div>
        <div className="flex gap-3">
          {dayLessons.length > 0 && (
            <button 
              onClick={() => setIsDuplicateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Copy className="w-4 h-4" />
              复用本日课表
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            添加排课
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-medium text-gray-900">
            {weekDays[0].getFullYear()}年{weekDays[0].getMonth() + 1}月
          </span>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
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
                className={`flex flex-col items-center py-4 transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                  {dayNames[index]}
                </span>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 
                  isToday ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
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
                  <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <BookOpen className="w-4 h-4" />
                        {course?.name} ({course?.grade})
                      </div>
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
                        className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded"
                        title="复用到下周"
                      >
                        <Copy className="w-3 h-3" />
                        复用到下周
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{lesson.title}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-1 rounded-md ${
                        lesson.status === 'completed' ? 'bg-green-100 text-green-700' :
                        lesson.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">添加排课</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
                <select 
                  required
                  value={newLessonData.courseId}
                  onChange={e => setNewLessonData({...newLessonData, courseId: e.target.value})}
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
                  value={newLessonData.title}
                  onChange={e => setNewLessonData({...newLessonData, title: e.target.value})}
                  placeholder="例如：第三单元：测量"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上课时间段</label>
                {settings.timetableSlots && settings.timetableSlots.length > 0 ? (
                  <select 
                    required
                    value={newLessonData.time}
                    onChange={e => setNewLessonData({...newLessonData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择时间段...</option>
                    {settings.timetableSlots.map(slot => (
                      <option key={slot.id} value={slot.startTime}>{slot.name} ({slot.startTime} - {slot.endTime})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="time" 
                    required
                    value={newLessonData.time}
                    onChange={e => setNewLessonData({...newLessonData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
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

      {/* Duplicate Schedule Modal */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">复用本日课表</h2>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDuplicateSubmit} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  将把 <strong>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日</strong> 的 {dayLessons.length} 节课完整复用到目标日期。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择目标日期</label>
                <input 
                  type="date" 
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
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
