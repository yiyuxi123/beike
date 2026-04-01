import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Clock, Paperclip, ChevronDown, ChevronUp, AlertCircle, Play, CheckSquare, Square, Upload } from 'lucide-react';
import { Lesson, Task, UserSettings, Attachment, Course } from '../types';
import { formatTimeUntil, formatDate } from '../utils/dateUtils';
import { playDing } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface LessonCardProps {
  key?: string | number;
  lesson: Lesson;
  course?: Course;
  settings: UserSettings;
  onUpdate: (lesson: Lesson) => void;
}

export default function LessonCard({ lesson, course, settings, onUpdate }: LessonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { text: timeText, isUrgent } = formatTimeUntil(lesson.classTime, settings.reminderHours);

  const completedTasksCount = lesson.tasks.filter(t => t.completed).length;
  const totalTasksCount = lesson.tasks.length;
  const allTasksCompleted = totalTasksCount > 0 && completedTasksCount === totalTasksCount;

  const handleTaskToggle = (taskId: string) => {
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
        const options = { mode: 'readwrite' as const };
        if ((await settings.archiveDirectoryHandle.queryPermission(options)) !== 'granted') {
          await settings.archiveDirectoryHandle.requestPermission(options);
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

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all duration-200 relative ${lesson.status === 'completed' ? 'border-green-200 opacity-80' : 'border-gray-200 hover:shadow-md'}`}>
      
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
        className="p-4 flex items-center cursor-pointer select-none relative z-20"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Big Checkmark */}
        <div 
          className="mr-4 flex-shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95 relative"
          onClick={handleMainCheck}
        >
          {lesson.status === 'completed' ? (
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          ) : (
            <Circle className={`w-10 h-10 ${allTasksCompleted ? 'text-blue-500 hover:text-green-500' : 'text-gray-300 hover:text-gray-400'}`} />
          )}
        </div>

        {/* Core Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-lg font-semibold truncate ${lesson.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {lesson.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(lesson.classTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="w-4 h-4" />
              <span>{completedTasksCount}/{totalTasksCount} 项</span>
            </div>
            {lesson.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-4 h-4" />
                <span>{lesson.attachments.length} 个附件</span>
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
            <div className="p-4 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Checklist */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>备课清单</span>
                    <span className="text-xs text-gray-500 font-normal">{totalTasksCount > 0 ? Math.round((completedTasksCount/totalTasksCount)*100) : 0}%</span>
                  </h4>
                  <div className="space-y-2">
                    {lesson.tasks.map(task => (
                      <div 
                        key={task.id} 
                        className="flex items-start gap-2 cursor-pointer group"
                        onClick={(e) => { e.stopPropagation(); handleTaskToggle(task.id); }}
                      >
                        <div className="mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
                          {task.completed ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                        </div>
                        <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attachments & Actions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">课件与附件</h4>
                  {lesson.attachments.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {lesson.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-blue-300 cursor-pointer transition-colors">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mb-4 italic">暂无附件</div>
                  )}
                  
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      上传附件
                    </button>
                    {lesson.status !== 'completed' && (
                      <button className="flex-1 py-2 px-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />
                        专注备课
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Post-class reflection if completed */}
              {lesson.status === 'completed' && new Date(lesson.classTime) < new Date() && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">教学反思</h4>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-full border border-green-200 bg-green-50 text-green-700 text-sm hover:bg-green-100 transition-colors">
                      非常满意
                    </button>
                    <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                      效果一般
                    </button>
                    <button 
                      className="px-4 py-2 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-sm hover:bg-orange-100 transition-colors"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
