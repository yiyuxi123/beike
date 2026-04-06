import React, { useMemo, useState } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import { AlertCircle, CheckCircle2, Clock, Calendar as CalendarIcon, ArrowRight, BookOpen, TrendingUp, Edit3 } from 'lucide-react';
import { formatTimeUntil, formatDate } from '../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  courses: Course[];
  lessons: Lesson[];
  settings: UserSettings;
  onSelectCourse: (courseId: string) => void;
  onUpdateSettings: (settings: UserSettings) => void;
}

export default function Dashboard({ courses, lessons, settings, onSelectCourse, onUpdateSettings }: DashboardProps) {
  const [note, setNote] = useState(settings.quickNote || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleSaveNote = () => {
    setIsSavingNote(true);
    onUpdateSettings({ ...settings, quickNote: note });
    setTimeout(() => setIsSavingNote(false), 500);
  };
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

  const upcomingLessons = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return lessons.filter(l => {
      const classTime = new Date(l.classTime);
      return classTime >= now && classTime <= nextWeek && l.status !== 'completed';
    }).sort((a, b) => new Date(a.classTime).getTime() - new Date(b.classTime).getTime()).slice(0, 5);
  }, [lessons]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      
      const dayLessons = completedLessons.filter(l => {
        const ld = new Date(l.classTime);
        return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
      });
      
      const prepTime = dayLessons.reduce((acc, l) => acc + (l.prepTime || 0), 0);
      return { name: dateStr, prepTime };
    });
  }, [completedLessons]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const pieData = useMemo(() => {
    return courses.map(course => {
      const count = lessons.filter(l => l.courseId === course.id).length;
      return { name: course.name, value: count };
    }).filter(d => d.value > 0);
  }, [courses, lessons]);

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

      {/* Upcoming Lessons */}
      {upcomingLessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            未来7天待备课
          </h2>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="space-y-3">
              {upcomingLessons.map(lesson => {
                const course = courses.find(c => c.id === lesson.courseId);
                const classTime = new Date(lesson.classTime);
                const timeStr = `${classTime.getMonth() + 1}月${classTime.getDate()}日 ${classTime.getHours().toString().padStart(2, '0')}:${classTime.getMinutes().toString().padStart(2, '0')}`;
                return (
                  <div key={lesson.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-100 transition-colors group">
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{lesson.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{course?.name} · {timeStr}</p>
                    </div>
                    <button 
                      onClick={() => onSelectCourse(lesson.courseId)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                    >
                      去备课
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Course Progress Overview */}
      <div className="mb-8">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">近7天备课时长 (分钟)</h2>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="prepTime" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">课时分布</h2>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">暂无数据</div>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Note */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-purple-500" />
          备忘录
        </h2>
        <div className="bg-gradient-to-br from-purple-50/50 to-white border border-purple-100 rounded-3xl p-6 shadow-sm relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="在这里记录一些灵感、待办事项或备忘..."
            className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 text-gray-700 placeholder-gray-400"
          />
          <div className="absolute bottom-4 right-6 text-xs text-gray-400">
            {isSavingNote ? '保存中...' : '自动保存'}
          </div>
        </div>
      </div>
    </div>
  );
}
