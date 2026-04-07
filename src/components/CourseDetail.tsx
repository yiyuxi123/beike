import React, { useState } from 'react';
import { Course, Lesson, UserSettings } from '../types';
import LessonCard from './LessonCard';
import { BookOpen, Plus, X, Clock, Archive } from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  lessons: Lesson[];
  settings: UserSettings;
  onUpdateLesson: (lesson: Lesson) => void;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onDeleteLesson: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
}

export default function CourseDetail({ course, lessons, settings, onUpdateLesson, onAddLesson, onDeleteLesson, onUpdateCourse }: CourseDetailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(settings.timetableSlots?.[0]?.startTime || '08:00');
  const [isSpecialTime, setIsSpecialTime] = useState(false);
  const [newLessonType, setNewLessonType] = useState<Lesson['lessonType']>('新授课');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalCount = lessons.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const sortedLessons = [...lessons].sort((a, b) => new Date(a.classTime).getTime() - new Date(b.classTime).getTime());
  
  const filteredLessons = sortedLessons.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'completed') return l.status === 'completed';
    if (filter === 'pending') return l.status !== 'completed';
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedLessons);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLessons(newSelection);
  };

  const selectAll = () => {
    if (selectedLessons.size === filteredLessons.length) {
      setSelectedLessons(new Set());
    } else {
      setSelectedLessons(new Set(filteredLessons.map(l => l.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedLessons.size === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedLessons.size} 个课时吗？`)) {
      selectedLessons.forEach(id => onDeleteLesson(id));
      setSelectedLessons(new Set());
      setIsBatchMode(false);
    }
  };

  const handleBatchComplete = () => {
    if (selectedLessons.size === 0) return;
    if (window.confirm(`确定要将选中的 ${selectedLessons.size} 个课时标记为已完成吗？`)) {
      selectedLessons.forEach(id => {
        const lesson = lessons.find(l => l.id === id);
        if (lesson) {
          onUpdateLesson({ ...lesson, status: 'completed' });
        }
      });
      setSelectedLessons(new Set());
      setIsBatchMode(false);
    }
  };

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
      prepTime: 0,
      lessonType: newLessonType
    });
    
    setIsModalOpen(false);
    setNewTitle('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime(settings.timetableSlots?.[0]?.startTime || '08:00');
    setIsSpecialTime(false);
    setNewLessonType('新授课');
  };

  const handleExportCourse = () => {
    let md = `# ${course.name}\n\n`;
    md += `**科目：** ${course.subject} | **年级：** ${course.grade} | **学期：** ${course.term}\n\n`;
    md += `**备课进度：** ${completedCount} / ${totalCount} (${percentage}%)\n\n---\n\n`;

    sortedLessons.forEach(lesson => {
      md += `## ${lesson.title}\n\n`;
      md += `- **时间：** ${new Date(lesson.classTime).toLocaleString()}\n`;
      md += `- **课型：** ${lesson.lessonType || '新授课'}\n`;
      md += `- **状态：** ${lesson.status === 'completed' ? '已完成' : lesson.status === 'in_progress' ? '备课中' : '未开始'}\n\n`;
      
      if (lesson.prepGoal) {
        md += `### 教学目标\n\n${lesson.prepGoal}\n\n`;
      }
      
      if (lesson.tasks.length > 0) {
        md += `### 备课清单\n\n`;
        lesson.tasks.forEach(task => {
          md += `- [${task.completed ? 'x' : ' '}] ${task.title}\n`;
        });
        md += `\n`;
      }

      if (lesson.reflection) {
        md += `### 教学反思\n\n${lesson.reflection}\n\n`;
      }
      
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${course.name}备课计划.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      {/* Course Header */}
      <div className="bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-[2rem] border border-blue-100/50 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold mb-4">
              <span className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {course.subject}
              </span>
              <span className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg">{course.grade}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{course.name}</h1>
            <p className="text-gray-500 mt-3 text-lg">{course.term}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (window.confirm(`确定要${course.isArchived ? '取消归档' : '归档'}课程 "${course.name}" 吗？`)) {
                  onUpdateCourse({ ...course, isArchived: !course.isArchived });
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 bg-white border rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${course.isArchived ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              title={course.isArchived ? "取消归档" : "归档课程"}
            >
              <Archive className="w-4 h-4" />
              {course.isArchived ? '取消归档' : '归档'}
            </button>
            <button 
              onClick={handleExportCourse}
              className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              title="导出课程计划 (Markdown)"
            >
              导出计划
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              添加课时
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600 font-medium">备课总进度</span>
              <span className="text-gray-900 font-bold text-lg">{completedCount} <span className="text-gray-400 text-sm font-normal">/ {totalCount}</span></span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden border border-gray-100">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            全部课时
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            待备课
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            已完成
          </button>
        </div>
        
        {filteredLessons.length > 0 && (
          <div className="flex items-center gap-2">
            {isBatchMode ? (
              <>
                <span className="text-sm text-gray-500 mr-2">已选 {selectedLessons.size} 项</span>
                <button 
                  onClick={selectAll}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {selectedLessons.size === filteredLessons.length ? '取消全选' : '全选'}
                </button>
                <button 
                  onClick={handleBatchComplete}
                  disabled={selectedLessons.size === 0}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  标记完成
                </button>
                <button 
                  onClick={handleBatchDelete}
                  disabled={selectedLessons.size === 0}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  删除
                </button>
                <button 
                  onClick={() => setIsBatchMode(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                  取消
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsBatchMode(true)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
              >
                批量操作
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {filteredLessons.map(lesson => (
          <div key={lesson.id} className="relative flex items-start gap-3">
            {isBatchMode && (
              <div className="pt-6 pl-2">
                <input 
                  type="checkbox" 
                  checked={selectedLessons.has(lesson.id)}
                  onChange={() => toggleSelection(lesson.id)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <LessonCard 
                lesson={lesson} 
                course={course}
                settings={settings}
                onUpdate={onUpdateLesson} 
                onDelete={() => onDeleteLesson(lesson.id)}
              />
            </div>
          </div>
        ))}
        {filteredLessons.length === 0 && (
          <div className="text-center py-24 text-gray-500 bg-gradient-to-b from-gray-50/50 to-white rounded-[2rem] border border-gray-200 border-dashed">
            <div className="w-20 h-20 bg-white shadow-sm rounded-3xl flex items-center justify-center mx-auto mb-5 transform -rotate-3">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无课时</h3>
            <p className="text-gray-500">
              {filter === 'all' ? '点击右上角“添加课时”开始备课' : '没有符合当前筛选条件的课时'}
            </p>
          </div>
        )}
      </div>

      {/* Add Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">添加新课时</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">课时标题</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="例如：第三单元：测量"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">上课日期</label>
                  <input 
                    type="date" 
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
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
                        onClick={() => {
                          setNewTime(slot.startTime);
                          setIsSpecialTime(false);
                        }}
                        className={`p-3 text-sm rounded-xl border transition-all duration-200 ${
                          newTime === slot.startTime && !isSpecialTime 
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
                      onClick={() => setIsSpecialTime(true)}
                      className={`p-3 text-sm rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
                        isSpecialTime 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-600'
                      }`}
                    >
                      <Clock className="w-5 h-5 mb-1" />
                      <span className="text-xs font-semibold">自定义时间</span>
                    </button>
                  </div>
                  
                  {isSpecialTime && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="time" 
                        required
                        value={newTime}
                        onChange={e => setNewTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">课型</label>
                  <select
                    value={newLessonType}
                    onChange={e => setNewLessonType(e.target.value as Lesson['lessonType'])}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm bg-white"
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
    </div>
  );
}
