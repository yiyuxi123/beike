import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Calendar, FileText, X } from 'lucide-react';
import { Course, Lesson } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils/dateUtils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  lessons: Lesson[];
  onSelectCourse: (courseId: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, courses, lessons, onSelectCourse }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // We need to trigger open from App.tsx, so this listener might be better there.
        // But we can handle Escape here.
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.subject.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLessons = lessons.filter(l => 
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.prepGoal?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" 
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-gray-100"
        >
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索课程、课时、备课目标... (Esc 取消)"
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400 text-lg"
            />
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.trim() === '' ? (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>输入关键字开始全局搜索</p>
              </div>
            ) : (
              <>
                {filteredCourses.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">课程</div>
                    {filteredCourses.map(course => (
                      <div 
                        key={course.id}
                        onClick={() => { onSelectCourse(course.id); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-xl cursor-pointer group transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{course.name}</div>
                          <div className="text-xs text-gray-500">{course.grade} · {course.subject}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredLessons.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">课时</div>
                    {filteredLessons.map(lesson => {
                      const course = courses.find(c => c.id === lesson.courseId);
                      return (
                        <div 
                          key={lesson.id}
                          onClick={() => { onSelectCourse(lesson.courseId); onClose(); }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 rounded-xl cursor-pointer group transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-purple-700 truncate">{lesson.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{course?.name || '未知课程'}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(lesson.classTime)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredCourses.length === 0 && filteredLessons.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    没有找到匹配的结果
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
