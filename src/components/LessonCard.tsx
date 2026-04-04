import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Clock, Paperclip, ChevronDown, ChevronUp, AlertCircle, Play, CheckSquare, Square, Upload, Trash2, Plus, Target } from 'lucide-react';
import { Lesson, Task, UserSettings, Attachment, Course } from '../types';
import { formatTimeUntil, formatDate } from '../utils/dateUtils';
import { playDing, playTick, playSuccess } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface LessonCardProps {
  key?: string | number;
  lesson: Lesson;
  course?: Course;
  settings: UserSettings;
  onUpdate: (lesson: Lesson) => void;
  onDelete?: () => void;
}

export default function LessonCard({ lesson, course, settings, onUpdate, onDelete }: LessonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { text: timeText, isUrgent } = formatTimeUntil(lesson.classTime, settings.reminderHours);

  const completedTasksCount = lesson.tasks.filter(t => t.completed).length;
  const totalTasksCount = lesson.tasks.length;
  const allTasksCompleted = totalTasksCount > 0 && completedTasksCount === totalTasksCount;

  const handleTaskToggle = (taskId: string) => {
    const task = lesson.tasks.find(t => t.id === taskId);
    if (task && !task.completed && settings.soundEnabled) {
      playTick();
    }

    const updatedTasks = lesson.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    const newCompletedCount = updatedTasks.filter(t => t.completed).length;
    let newStatus = lesson.status;
    
    if (newCompletedCount === 0) newStatus = 'not_started';
    else if (newCompletedCount < totalTasksCount) newStatus = 'in_progress';

    onUpdate({
      ...lesson,
      tasks: updatedTasks,
      status: newStatus
    });
  };

  const handleMainCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lesson.status === 'completed') {
      onUpdate({ ...lesson, status: 'in_progress' });
    } else {
      if (!allTasksCompleted) {
        alert('请先完成所有备课子项！');
        setExpanded(true);
        return;
      }
      if (settings.soundEnabled) {
        playDing();
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1000);
      }
      onUpdate({ ...lesson, status: 'completed' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = Array.from(files).map((file: File) => {
      let type: Attachment['type'] = 'document';
      if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
        type = 'presentation';
      } else if (file.type.includes('video')) {
        type = 'video';
      }
      return {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type
      };
    });

    onUpdate({
      ...lesson,
      attachments: [...lesson.attachments, ...newAttachments]
    });

    if (settings.archiveDirectoryHandle) {
      try {
        // Request permission if needed
        const options = { mode: 'readwrite' as any };
        if ((await (settings.archiveDirectoryHandle as any).queryPermission(options)) !== 'granted') {
          await (settings.archiveDirectoryHandle as any).requestPermission(options);
        }

        // Create directory structure: Term / Course / Lesson
        const termHandle = await settings.archiveDirectoryHandle.getDirectoryHandle(course?.term || '未分类学期', { create: true });
        const courseHandle = await termHandle.getDirectoryHandle(course?.name || '未分类课程', { create: true });
        // Replace invalid characters in lesson title for folder name
        const safeTitle = lesson.title.replace(/[\\/:*?"<>|]/g, '_');
        const lessonHandle = await courseHandle.getDirectoryHandle(safeTitle, { create: true });

        // Write files
        for (const file of Array.from(files)) {
          const fileHandle = await lessonHandle.getFileHandle((file as File).name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(file);
          await writable.close();
        }

        const folderPath = `${settings.archiveFolder}/${course?.term || '未分类学期'}/${course?.name || '未分类课程'}/${safeTitle}`;
        alert(`文件已成功写入本地文件夹:\n${folderPath}`);
      } catch (error) {
        console.error('Error writing file to local directory:', error);
        alert(`文件写入失败，请检查浏览器权限。\n目标路径: ${settings.archiveFolder}/${course?.term || '未分类学期'}/${course?.name || '未分类课程'}/${lesson.title}`);
      }
    } else if (settings.archiveFolder) {
      const folderPath = `${settings.archiveFolder}/${course?.term || '未分类学期'}/${course?.name || '未分类课程'}/${lesson.title}`;
      alert(`(模拟) 已自动归档至:\n${folderPath}\n\n提示：如需真实写入本地，请在设置中重新选择归档文件夹授权。`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = () => {
    switch (lesson.status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'needs_revision': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (lesson.status) {
      case 'completed': return '已完成';
      case 'in_progress': return '备课中';
      case 'needs_revision': return '待优化';
      default: return '未开始';
    }
  };

  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const openAttachment = async (att: Attachment) => {
    if (!settings.archiveDirectoryHandle) {
      alert('请先在设置中选择归档文件夹，才能打开文件。');
      return;
    }
    try {
      const options = { mode: 'read' as any };
      if ((await (settings.archiveDirectoryHandle as any).queryPermission(options)) !== 'granted') {
        if ((await (settings.archiveDirectoryHandle as any).requestPermission(options)) !== 'granted') {
          return;
        }
      }
      
      const termHandle = await settings.archiveDirectoryHandle.getDirectoryHandle(course?.term || '未分类学期');
      const courseHandle = await termHandle.getDirectoryHandle(course?.name || '未分类课程');
      const safeTitle = lesson.title.replace(/[\\/:*?"<>|]/g, '_');
      const lessonHandle = await courseHandle.getDirectoryHandle(safeTitle);
      const fileHandle = await lessonHandle.getFileHandle(att.name);
      const file = await fileHandle.getFile();
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to open attachment', e);
      alert('无法打开文件，可能文件已被移动或删除。');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newTaskTitle.trim(),
      completed: false
    };
    
    onUpdate({
      ...lesson,
      tasks: [...lesson.tasks, newTask],
      status: lesson.status === 'completed' ? 'in_progress' : lesson.status
    });
    setNewTaskTitle('');
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTasks = lesson.tasks.filter(t => t.id !== taskId);
    
    const newCompletedCount = updatedTasks.filter(t => t.completed).length;
    let newStatus = lesson.status;
    
    if (updatedTasks.length === 0) newStatus = 'not_started';
    else if (newCompletedCount === updatedTasks.length) newStatus = 'completed';
    else if (newCompletedCount === 0) newStatus = 'not_started';
    else newStatus = 'in_progress';

    onUpdate({
      ...lesson,
      tasks: updatedTasks,
      status: newStatus
    });
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...lesson,
      prepGoal: e.target.value
    });
  };

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const toggleFocusMode = () => {
    if (isFocusMode) {
      // Stop focus mode
      if (timerRef.current) clearInterval(timerRef.current);
      setIsFocusMode(false);
      if (settings.soundEnabled) playSuccess();
      
      // Add elapsed time to prepTime (convert seconds to minutes)
      const addedMinutes = Math.floor(focusTime / 60);
      if (addedMinutes > 0) {
        onUpdate({
          ...lesson,
          prepTime: (lesson.prepTime || 0) + addedMinutes
        });
      }
      setFocusTime(0);
    } else {
      // Start focus mode
      setIsFocusMode(true);
      if (settings.soundEnabled) playTick();
      timerRef.current = window.setInterval(() => {
        setFocusTime(prev => prev + 1);
      }, 1000);
    }
  };

  const formatFocusTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={`bg-white rounded-3xl border shadow-sm transition-all duration-300 relative group hover:-translate-y-1 ${lesson.status === 'completed' ? 'border-green-200 opacity-80' : 'border-gray-100 hover:shadow-md hover:border-blue-200'}`}>
      
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute left-8 top-8 w-10 h-10 bg-green-400 rounded-full pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      <div 
        className="p-5 flex items-center cursor-pointer select-none relative z-20"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Big Checkmark */}
        <div 
          className="mr-5 flex-shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95 relative"
          onClick={handleMainCheck}
        >
          {lesson.status === 'completed' ? (
            <CheckCircle2 className="w-12 h-12 text-green-500 drop-shadow-sm" />
          ) : (
            <Circle className={`w-10 h-10 ${allTasksCompleted ? 'text-blue-500 hover:text-green-500' : 'text-gray-300 hover:text-gray-400'}`} />
          )}
        </div>

        {/* Core Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-xl font-bold truncate tracking-tight ${lesson.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>
              {lesson.title}
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-medium">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDate(lesson.classTime)}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${allTasksCompleted ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100'}`}>
              <CheckSquare className={`w-4 h-4 ${allTasksCompleted ? 'text-green-500' : 'text-gray-400'}`} />
              <span>{completedTasksCount}/{totalTasksCount} 项</span>
            </div>
            {lesson.attachments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-medium">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span>{lesson.attachments.length} 个附件</span>
              </div>
            )}
            {(lesson.prepTime || 0) > 0 && !isFocusMode && (
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 text-orange-700 font-medium">
                <Target className="w-4 h-4 text-orange-500" />
                <span>已专注 {lesson.prepTime} 分钟</span>
              </div>
            )}
            {isFocusMode && (
              <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 text-red-700 font-medium animate-pulse">
                <Target className="w-4 h-4 text-red-500" />
                <span>专注中 {formatFocusTime(focusTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side info */}
        <div className="flex flex-col items-end ml-4 space-y-2">
          {lesson.status !== 'completed' && (
            <div className={`text-sm flex items-center gap-1 ${isUrgent ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {isUrgent && <AlertCircle className="w-4 h-4" />}
              {timeText}
            </div>
          )}
          <div className="text-gray-400">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-6 bg-gray-50/80 rounded-b-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Checklist & Goal */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      备课目标
                    </h4>
                    <textarea
                      value={lesson.prepGoal || ''}
                      onChange={handleGoalChange}
                      placeholder="输入本节课的教学目标、重难点等..."
                      className="w-full text-sm p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-28 bg-white shadow-sm transition-shadow hover:shadow"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center justify-between">
                      <span>备课清单</span>
                      <span className="text-xs text-gray-500 font-normal bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">{totalTasksCount > 0 ? Math.round((completedTasksCount/totalTasksCount)*100) : 0}%</span>
                    </h4>
                    <div className="space-y-2.5 mb-4">
                      {lesson.tasks.map(task => (
                        <div 
                          key={task.id} 
                          className="flex items-start justify-between gap-3 cursor-pointer group p-2.5 -mx-2.5 rounded-xl hover:bg-white transition-all hover:shadow-sm"
                          onClick={(e) => { e.stopPropagation(); handleTaskToggle(task.id); }}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
                              {task.completed ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                            </div>
                            <span className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                              {task.title}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                            title="删除任务"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <form onSubmit={handleAddTask} className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="添加新任务..."
                        className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button 
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Focus Timer Display */}
                <AnimatePresence>
                  {isFocusMode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-200">
                          <motion.div 
                            className="h-full bg-orange-500"
                            animate={{ width: ['0%', '100%'] }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                        <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          专注备课中
                        </h4>
                        <div className="text-5xl font-mono font-bold text-orange-600 tracking-wider mb-4 drop-shadow-sm">
                          {formatFocusTime(focusTime)}
                        </div>
                        <p className="text-xs text-orange-600/80 font-medium">保持专注，高效完成备课任务</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                  {/* Attachments & Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-500" />
                      课件与附件
                    </h4>
                    {lesson.attachments.length > 0 ? (
                      <div className="space-y-2.5 mb-6">
                        {lesson.attachments.map(att => (
                          <div 
                            key={att.id} 
                            onClick={() => openAttachment(att)}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl text-sm hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <Paperclip className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-gray-700 font-medium truncate flex-1">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 mb-6 bg-white border border-gray-200 border-dashed rounded-xl p-6 text-center shadow-sm">暂无附件</div>
                    )}
                  
                  <div className="flex gap-3">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      上传附件
                    </button>
                    {lesson.status !== 'completed' && (
                      <button 
                        onClick={toggleFocusMode}
                        className={`flex-1 py-2.5 px-4 border rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 ${
                          isFocusMode 
                            ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' 
                            : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {isFocusMode ? (
                          <>
                            <Square className="w-4 h-4 fill-current" />
                            结束专注
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            专注备课
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Post-class reflection if completed */}
              {lesson.status === 'completed' && new Date(lesson.classTime) < new Date() && (
                <div className="mt-8 pt-6 border-t border-gray-200/60">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    教学反思
                  </h4>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-all shadow-sm hover:shadow">
                      非常满意
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm hover:shadow">
                      效果一般
                    </button>
                    <button 
                      className="flex-1 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-all shadow-sm hover:shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ ...lesson, status: 'needs_revision' });
                      }}
                    >
                      需重讲/优化
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Lesson Button */}
              {onDelete && (
                <div className="mt-8 pt-6 border-t border-gray-200/60 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('确定要删除这个课时吗？')) {
                        onDelete();
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除课时
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
