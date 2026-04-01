import React, { useState } from 'react';
import { Lesson, Course, UserSettings } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { formatTimeUntil } from '../utils/dateUtils';

interface CalendarViewProps {
  lessons: Lesson[];
  courses: Course[];
  settings: UserSettings;
}

export default function CalendarView({ lessons, courses, settings }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">备课本日历</h1>
          <p className="text-gray-500 mt-1">全局掌控教学节奏</p>
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
              <div key={day} className={`border-b border-r border-gray-100 p-2 transition-colors hover:bg-gray-50 ${isToday ? 'bg-blue-50/30' : ''}`}>
                <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[70px] pr-1 scrollbar-hide">
                  {dayLessons.map(lesson => {
                    const course = courses.find(c => c.id === lesson.courseId);
                    const isUrgent = formatTimeUntil(lesson.classTime, settings.reminderHours).isUrgent && lesson.status !== 'completed';
                    
                    return (
                      <div 
                        key={lesson.id} 
                        className={`text-xs px-2 py-1 rounded truncate flex items-center gap-1 border ${
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
    </div>
  );
}
