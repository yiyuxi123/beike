import React, { useMemo } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatTimeUntil } from '../utils/dateUtils';

interface DashboardProps {
  courses: Course[];
  lessons: Lesson[];
  settings: UserSettings;
  onSelectCourse: (courseId: string) => void;
}

export default function Dashboard({ courses, lessons, settings, onSelectCourse }: DashboardProps) {
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{greeting()}，{settings.personalInfo?.name || '老师'}</h1>
        <p className="text-gray-500 mt-2 text-lg">今天是你使用备课印记的第 <span className="font-semibold text-blue-600">{daysUsed}</span> 天，继续保持！</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-3xl border border-blue-100/50 shadow-sm flex items-center gap-5 hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-inner border border-blue-50">
            <CheckCircle2 className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">整体打勾率</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{completionRate}%</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50/50 p-6 rounded-3xl border border-orange-100/50 shadow-sm flex items-center gap-5 hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-inner border border-orange-50">
            <Clock className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">平均备课时长</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{avgPrepTime} <span className="text-base font-normal text-gray-500">分钟/课时</span></p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50/50 p-6 rounded-3xl border border-red-100/50 shadow-sm flex items-center gap-5 relative overflow-hidden hover:shadow-md transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-100/50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center relative z-10 shadow-inner border border-red-50">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-red-600 font-medium mb-1">积压未备课时</p>
            <p className="text-3xl font-bold text-red-700 tracking-tight">{urgentLessons.length} <span className="text-base font-normal text-red-500">节</span></p>
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
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5">
            <div className="space-y-3">
              {urgentLessons.map(lesson => {
                const course = courses.find(c => c.id === lesson.courseId);
                return (
                  <div key={lesson.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{course?.name} · {formatTimeUntil(lesson.classTime, settings.reminderHours).text}</p>
                    </div>
                    <button 
                      onClick={() => onSelectCourse(lesson.courseId)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
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
              <div 
                key={course.id} 
                onClick={() => onSelectCourse(course.id)}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">{course.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-100">{course.grade}</span>
                      <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-100">{course.term}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900 tracking-tight">{percentage}%</span>
                    <p className="text-sm text-gray-500 mt-1">{completed}/{total} 课时</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden border border-gray-100">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out relative" 
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/20"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
