import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Clock, Paperclip, ChevronDown, ChevronUp, AlertCircle, Play, CheckSquare, Square, Upload, Trash2, Plus, Target, Printer, Sparkles, Edit2, Eye, GripVertical } from 'lucide-react';
import { Lesson, Task, UserSettings, Attachment, Course } from '../types';
import { formatTimeUntil, formatDate } from '../utils/dateUtils';
import { playDing, playTick, playSuccess } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { generatePrepGoal } from '../utils/ai';
import Markdown from 'react-markdown';

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
  const [isFullscreenFocus, setIsFullscreenFocus] = useState(false);
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
    
    const titles = newTaskTitle.split(/[,，、]/).map(t => t.trim()).filter(t => t);
    const newTasks: Task[] = titles.map((title, index) => ({
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
      title,
      completed: false
    }));
    
    onUpdate({
      ...lesson,
      tasks: [...lesson.tasks, ...newTasks],
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

  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!course) {
      alert('无法获取课程信息，请确保该课时已关联课程。');
      return;
    }
    setIsGenerating(true);
    try {
      const goal = await generatePrepGoal(course.name, lesson.title, course.grade);
      onUpdate({
        ...lesson,
        prepGoal: goal
      });
    } catch (error) {
      alert('AI 生成失败，请稍后重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>${lesson.title} - 教案</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; margin-bottom: 1rem; }
            h2 { margin-top: 2rem; color: #444; border-left: 4px solid #3b82f6; padding-left: 0.5rem; }
            .meta { color: #666; margin-bottom: 2rem; display: flex; gap: 2rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; }
            .task-list { list-style: none; padding: 0; }
            .task-list li { margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
            .task-list li::before { content: '☐'; color: #999; font-size: 1.2rem; }
            .task-list li.completed::before { content: '☑'; color: #10b981; font-size: 1.2rem; }
            .task-list li.completed { color: #666; text-decoration: line-through; }
            .content-box { white-space: pre-wrap; background: #fff; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
          </style>
        </head>
        <body>
          <h1>${lesson.title}</h1>
          <div class="meta">
            <div><strong>课程：</strong> ${course?.name || '未知课程'} (${course?.grade || ''})</div>
            <div><strong>时间：</strong> ${formatDate(lesson.classTime)}</div>
            <div><strong>状态：</strong> ${getStatusText()}</div>
          </div>
          
          <h2>教学目标</h2>
          <div class="content-box">${lesson.prepGoal || '未填写'}</div>
          
          <h2>备课清单</h2>
          <ul class="task-list">
            ${lesson.tasks.map(t => `<li class="${t.completed ? 'completed' : ''}">${t.title}</li>`).join('')}
          </ul>
          
          ${lesson.reflection ? `
            <h2>教学反思</h2>
            <div class="content-box">${lesson.reflection}</div>
          ` : ''}
          
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const timerRef = useRef<number | null>(null);

  const toggleFocusMode = () => {
    if (isFocusMode) {
      // Stop focus mode
      if (timerRef.current) clearInterval(timerRef.current);
      setIsFocusMode(false);
      if (settings.soundEnabled) playSuccess();
      
      // Add elapsed time to prepTime (convert seconds to minutes)
      let addedMinutes = 0;
      if (timerMode === 'stopwatch') {
        addedMinutes = Math.floor(focusTime / 60);
      } else {
        // For pomodoro, add the time that has elapsed
        addedMinutes = pomodoroMinutes - Math.ceil(focusTime / 60);
      }
      
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
      
      if (timerMode === 'pomodoro') {
        setFocusTime(pomodoroMinutes * 60);
      } else {
        setFocusTime(0);
      }
      
      timerRef.current = window.setInterval(() => {
        setFocusTime(prev => {
          if (timerMode === 'pomodoro') {
            if (prev <= 1) {
              // Pomodoro finished
              if (timerRef.current) clearInterval(timerRef.current);
              setIsFocusMode(false);
              setIsFullscreenFocus(false);
              if (settings.soundEnabled) playSuccess();
              onUpdate({
                ...lesson,
                prepTime: (lesson.prepTime || 0) + pomodoroMinutes
              });
              alert('番茄钟完成！休息一下吧。');
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
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
    <>
      {/* Fullscreen Focus Mode Overlay */}
      <AnimatePresence>
        {isFullscreenFocus && isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center text-white"
          >
            <div className="absolute top-8 right-8">
              <button 
                onClick={() => setIsFullscreenFocus(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium backdrop-blur-sm"
              >
                退出全屏
              </button>
            </div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white/80 mb-4">{lesson.title}</h2>
              <div className="text-[12rem] font-mono font-bold tracking-wider leading-none mb-8 text-orange-400 drop-shadow-[0_0_30px_rgba(251,146,60,0.3)]">
                {formatFocusTime(focusTime)}
              </div>
              <p className="text-xl text-white/50 mb-12">保持专注，高效完成备课任务</p>
              
              <button 
                onClick={() => {
                  setIsFullscreenFocus(false);
                  toggleFocusMode();
                }}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
              >
                结束专注
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {lesson.lessonType && (
              <span className="text-xs px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 font-medium">
                {lesson.lessonType}
              </span>
            )}
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
          <div className="flex items-center gap-2 text-gray-400">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrint(); }} 
              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
              title="打印教案"
            >
              <Printer className="w-4 h-4" />
            </button>
            <div className="p-1.5">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
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
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-semibold text-gray-700">课型：</label>
                <select
                  value={lesson.lessonType || '新授课'}
                  onChange={(e) => onUpdate({ ...lesson, lessonType: e.target.value as any })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                >
                  {['新授课', '复习课', '讲评课', '实验课', '公开课', '考试', '活动', '其他'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Checklist & Goal */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        备课目标
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleAIGenerate}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isGenerating ? '生成中...' : 'AI 辅助生成'}
                        </button>
                      </div>
                    </h4>
                    <div className="relative group">
                      <textarea
                        value={lesson.prepGoal || ''}
                        onChange={handleGoalChange}
                        placeholder="输入本节课的教学目标、重难点等 (支持 Markdown)..."
                        className="w-full text-sm p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 bg-white shadow-sm transition-shadow hover:shadow"
                      />
                      {lesson.prepGoal && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const el = document.getElementById(`markdown-preview-${lesson.id}`);
                              if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                            }}
                            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 shadow-sm"
                            title="切换预览"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {lesson.prepGoal && (
                      <div id={`markdown-preview-${lesson.id}`} className="hidden mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm prose prose-sm max-w-none">
                        <Markdown>{lesson.prepGoal}</Markdown>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center justify-between">
                      <span>备课清单</span>
                      <span className="text-xs text-gray-500 font-normal bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">{totalTasksCount > 0 ? Math.round((completedTasksCount/totalTasksCount)*100) : 0}%</span>
                    </h4>
                    <div className="space-y-2.5 mb-4">
                      {lesson.tasks.map((task, index) => (
                        <div 
                          key={task.id} 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', index.toString());
                            e.currentTarget.classList.add('opacity-50');
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50');
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-blue-50');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-blue-50');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-blue-50');
                            const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (dragIndex === index) return;
                            
                            const newTasks = [...lesson.tasks];
                            const [draggedTask] = newTasks.splice(dragIndex, 1);
                            newTasks.splice(index, 0, draggedTask);
                            
                            onUpdate({ ...lesson, tasks: newTasks });
                          }}
                          className="flex items-start justify-between gap-3 cursor-pointer group p-2.5 -mx-2.5 rounded-xl hover:bg-white transition-all hover:shadow-sm border border-transparent hover:border-gray-100"
                          onClick={(e) => { e.stopPropagation(); handleTaskToggle(task.id); }}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5 flex-shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="拖动排序">
                              <GripVertical className="w-5 h-5" />
                            </div>
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
                        placeholder="添加新任务 (支持逗号批量添加)..."
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
                          {timerMode === 'pomodoro' ? '番茄钟倒计时' : '专注备课中'}
                        </h4>
                        <div className="text-5xl font-mono font-bold text-orange-600 tracking-wider mb-4 drop-shadow-sm">
                          {formatFocusTime(focusTime)}
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xs text-orange-600/80 font-medium">保持专注，高效完成备课任务</p>
                          <button 
                            onClick={() => setIsFullscreenFocus(true)}
                            className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors font-medium"
                          >
                            全屏模式
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Focus Settings (Only shown when not focusing) */}
                {!isFocusMode && (
                  <div className="mb-8 flex items-center gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-800">专注模式</span>
                    </div>
                    <select
                      value={timerMode}
                      onChange={(e) => setTimerMode(e.target.value as 'stopwatch' | 'pomodoro')}
                      className="text-sm border-orange-200 rounded-lg text-orange-800 bg-white focus:ring-orange-500 focus:border-orange-500 py-1.5"
                    >
                      <option value="stopwatch">正计时</option>
                      <option value="pomodoro">番茄钟 (倒计时)</option>
                    </select>
                    {timerMode === 'pomodoro' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={pomodoroMinutes}
                          onChange={(e) => setPomodoroMinutes(parseInt(e.target.value) || 25)}
                          className="w-16 text-sm border-orange-200 rounded-lg text-orange-800 bg-white focus:ring-orange-500 focus:border-orange-500 py-1.5"
                        />
                        <span className="text-sm text-orange-800">分钟</span>
                      </div>
                    )}
                  </div>
                )}

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
                  <div className="relative group mb-4">
                    <textarea
                      value={lesson.reflection || ''}
                      onChange={(e) => onUpdate({ ...lesson, reflection: e.target.value })}
                      placeholder="记录本节课的闪光点、不足与改进建议 (支持 Markdown)..."
                      className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                    />
                    {lesson.reflection && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`markdown-preview-reflection-${lesson.id}`);
                            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                          }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 shadow-sm"
                          title="切换预览"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {lesson.reflection && (
                    <div id={`markdown-preview-reflection-${lesson.id}`} className="hidden mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm prose prose-sm max-w-none">
                      <Markdown>{lesson.reflection}</Markdown>
                    </div>
                  )}
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
    </>
  );
}
