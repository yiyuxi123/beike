import React, { useMemo } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatTimeUntil } from '../utils/dateUtils';

interface DashboardProps {
  courses: Course[];
  lessons: Lesson[];
  settings: UserSettings;
}

export default function Dashboard({ courses, lessons, settings }: DashboardProps) {
  const urgentLessons = lessons.filter(l => {
    const { isUrgent } = formatTimeUntil(l.classTime, settings.reminderHours);
    return isUrgent && l.status !== 'completed';
  });

  const completedLessons = lessons.filter(l => l.status === 'completed');
  const completedCount = completedLessons.length;
  const totalCount = lessons.length;
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const avgPrepTime = useMemo(() => {
    if (completedCount === 0) return 0;
    const totalPrepTime = completedLessons.reduce((acc, l) => acc + (l.prepTime || 0), 0);
    return Math.round(totalPrepTime / completedCount);
  }, [completedLessons, completedCount]);

  const daysUsed = useMemo(() => {
    if (lessons.length === 0) return 1;
    const earliest = Math.min(...lessons.map(l => new Date(l.classTime).getTime()));
    const now = new Date().getTime();
    const diffDays = Math.floor((now - earliest) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [lessons]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}，{settings.personalInfo?.name || '老师'}</h1>
        <p className="text-gray-500 mt-1">今天是你使用备课印记的第 {daysUsed} 天，继续保持！</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">整体打勾率</p>
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">平均备课时长</p>
            <p className="text-2xl font-bold text-gray-900">{avgPrepTime} <span className="text-base font-normal text-gray-500">分钟/课时</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center relative z-10">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-red-600 font-medium">积压未备课时</p>
            <p className="text-2xl font-bold text-red-700">{urgentLessons.length} <span className="text-base font-normal text-red-500">节</span></p>
          </div>
        </div>
      </div>

      {/* Urgent Tasks */}
      {urgentLessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            紧急待办
          </h2>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="space-y-3">
              {urgentLessons.map(lesson => {
                const course = courses.find(c => c.id === lesson.courseId);
                return (
                  <div key={lesson.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                    <div>
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{course?.name} · {formatTimeUntil(lesson.classTime, settings.reminderHours).text}</p>
                    </div>
                    <button className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                      去打勾
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Course Progress Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">课程进度</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(course => {
            const courseLessons = lessons.filter(l => l.courseId === course.id);
            const completed = courseLessons.filter(l => l.status === 'completed').length;
            const total = courseLessons.length;
            const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

            return (
              <div key={course.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{course.grade} · {course.term}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{completed}/{total} 课时</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
