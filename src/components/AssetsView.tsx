import React, { useState } from 'react';
import { Lesson, Course } from '../types';
import { Copy, FileText, CheckCircle2, Search, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

interface AssetsViewProps {
  lessons: Lesson[];
  courses: Course[];
  onDuplicate: (lesson: Lesson) => void;
}

export default function AssetsView({ lessons, courses, onDuplicate }: AssetsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const completedLessons = lessons.filter(l => {
    if (l.status !== 'completed') return false;
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const course = courses.find(c => c.id === l.courseId);
    
    return (
      l.title.toLowerCase().includes(query) ||
      (course?.name.toLowerCase().includes(query)) ||
      l.attachments.some(a => a.name.toLowerCase().includes(query))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedLessonId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">备课资产库</h1>
          <p className="text-gray-500 mt-1">沉淀教学智慧，一键复用往期优质备课</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索教案、课件、课程..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedLessons.map(lesson => {
          const course = courses.find(c => c.id === lesson.courseId);
          return (
            <div key={lesson.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已归档
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(lesson.classTime)}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{lesson.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course?.name} · {course?.term}</p>
                
                <div className="space-y-2">
                  <div 
                    className="flex items-center justify-between text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => toggleExpand(lesson.id)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>包含 {lesson.attachments.length} 个附件, {lesson.tasks.length} 项清单</span>
                    </div>
                    {expandedLessonId === lesson.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedLessonId === lesson.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                        {lesson.attachments.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">归档附件</h4>
                            <div className="space-y-1.5">
                              {lesson.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                  <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="truncate">{att.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {lesson.tasks.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">备课清单记录</h4>
                            <div className="space-y-1">
                              {lesson.tasks.map(task => (
                                <div key={task.id} className="flex items-start gap-2 text-sm text-gray-600">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{task.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
                <button 
                  onClick={() => onDuplicate(lesson)}
                  className="w-full py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  复用到新学期
                </button>
              </div>
            </div>
          );
        })}

        {completedLessons.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">资产库空空如也</h3>
            <p className="text-sm">完成备课打勾后，课时会自动归档到这里</p>
          </div>
        )}
      </div>
    </div>
  );
}
