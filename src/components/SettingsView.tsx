import React, { useState } from 'react';
import { Course, UserSettings } from '../types';
import { Bell, Volume2, ListTodo, Plus, Trash2, Save, CheckCircle2, FolderOpen, User, BookOpen, Clock } from 'lucide-react';
import { TimetableSlot } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  courses: Course[];
  onUpdateCourses: (courses: Course[]) => void;
}

export default function SettingsView({ settings, onUpdateSettings, courses, onUpdateCourses }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);
  const [newTask, setNewTask] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    name: '', subject: '', grade: '', term: ''
  });
  
  const [newSlot, setNewSlot] = useState<Partial<TimetableSlot>>({
    name: '', startTime: '08:00', endTime: '08:45'
  });

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onUpdateCourses(localCourses);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setLocalSettings({
      ...localSettings,
      defaultTasks: [...localSettings.defaultTasks, newTask.trim()]
    });
    setNewTask('');
  };

  const removeTask = (index: number) => {
    const newTasks = [...localSettings.defaultTasks];
    newTasks.splice(index, 1);
    setLocalSettings({
      ...localSettings,
      defaultTasks: newTasks
    });
  };

  const addCourse = () => {
    if (!newCourse.name || !newCourse.subject || !newCourse.grade || !newCourse.term) return;
    setLocalCourses([
      ...localCourses, 
      { ...newCourse, id: `c_${Date.now()}` } as Course
    ]);
    setNewCourse({ name: '', subject: '', grade: '', term: '' });
  };

  const removeCourse = (id: string) => {
    if (window.confirm('确定要删除该课程吗？相关的课时记录可能无法正常显示。')) {
      setLocalCourses(localCourses.filter(c => c.id !== id));
    }
  };

  const addSlot = () => {
    if (!newSlot.name || !newSlot.startTime || !newSlot.endTime) return;
    const currentSlots = localSettings.timetableSlots || [];
    setLocalSettings({
      ...localSettings,
      timetableSlots: [
        ...currentSlots,
        { ...newSlot, id: `ts_${Date.now()}` } as TimetableSlot
      ].sort((a, b) => a.startTime.localeCompare(b.startTime))
    });
    setNewSlot({ name: '', startTime: '08:00', endTime: '08:45' });
  };

  const removeSlot = (id: string) => {
    const currentSlots = localSettings.timetableSlots || [];
    setLocalSettings({
      ...localSettings,
      timetableSlots: currentSlots.filter(s => s.id !== id)
    });
  };

  const handleSelectFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const directoryHandle = await window.showDirectoryPicker();
        setLocalSettings({
          ...localSettings,
          archiveFolder: directoryHandle.name
        });
      } else {
        const folderName = prompt('您的浏览器不支持直接选择文件夹，请手动输入归档文件夹名称：', localSettings.archiveFolder || '备课归档');
        if (folderName) {
          setLocalSettings({
            ...localSettings,
            archiveFolder: folderName
          });
        }
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1">定制你的专属备课体验</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm relative"
        >
          {showSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {showSaved ? '已保存' : '保存设置'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Personal Info Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              个人信息
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input 
                  type="text" 
                  value={localSettings.personalInfo?.name || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings, 
                    personalInfo: { ...localSettings.personalInfo!, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职称/头衔</label>
                <input 
                  type="text" 
                  value={localSettings.personalInfo?.title || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings, 
                    personalInfo: { ...localSettings.personalInfo!, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">任职学校</label>
                <input 
                  type="text" 
                  value={localSettings.personalInfo?.school || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings, 
                    personalInfo: { ...localSettings.personalInfo!, school: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Management */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              课程管理
            </h2>
            <p className="text-sm text-gray-500 mt-1">管理您本学期教授的所有课程</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 mb-6">
              {localCourses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{course.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({course.subject} · {course.grade} · {course.term})</span>
                  </div>
                  <button 
                    onClick={() => removeCourse(course.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <input 
                type="text" 
                placeholder="课程名称 (如: 三年级数学上册)"
                value={newCourse.name}
                onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                className="col-span-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="text" 
                placeholder="学科 (如: 数学)"
                value={newCourse.subject}
                onChange={e => setNewCourse({...newCourse, subject: e.target.value})}
                className="col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="text" 
                placeholder="年级 (如: 三年级)"
                value={newCourse.grade}
                onChange={e => setNewCourse({...newCourse, grade: e.target.value})}
                className="col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="text" 
                placeholder="学期 (如: 2023-2024上)"
                value={newCourse.term}
                onChange={e => setNewCourse({...newCourse, term: e.target.value})}
                className="col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={addCourse}
                disabled={!newCourse.name || !newCourse.subject || !newCourse.grade || !newCourse.term}
                className="col-span-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Management */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              课节时间段设置
            </h2>
            <p className="text-sm text-gray-500 mt-1">集中设置每天的课节时间，方便排课时快速选择</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 mb-6">
              {(localSettings.timetableSlots || []).map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900 w-20">{slot.name}</span>
                    <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeSlot(slot.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!localSettings.timetableSlots || localSettings.timetableSlots.length === 0) && (
                <div className="text-sm text-gray-500 text-center py-4">暂无课节时间段，请添加</div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <input 
                type="text" 
                placeholder="课节名称 (如: 第一节)"
                value={newSlot.name}
                onChange={e => setNewSlot({...newSlot, name: e.target.value})}
                className="col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="time" 
                value={newSlot.startTime}
                onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                className="col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="time" 
                value={newSlot.endTime}
                onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                className="col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={addSlot}
                disabled={!newSlot.name || !newSlot.startTime || !newSlot.endTime}
                className="col-span-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Basic Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              基本偏好
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">紧急备课提醒阈值</h3>
                <p className="text-sm text-gray-500 mt-1">当距离上课不足设定时间且未打勾时，将显示为紧急状态</p>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={localSettings.reminderHours}
                  onChange={(e) => setLocalSettings({...localSettings, reminderHours: Number(e.target.value)})}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={12}>12 小时</option>
                  <option value={24}>24 小时</option>
                  <option value={48}>48 小时</option>
                  <option value={72}>72 小时</option>
                </select>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  打勾音效与动画
                </h3>
                <p className="text-sm text-gray-500 mt-1">完成备课打勾时播放清脆的提示音并显示庆祝动画</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localSettings.soundEnabled}
                  onChange={(e) => setLocalSettings({...localSettings, soundEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-gray-500" />
                  自动归档文件夹
                </h3>
                <p className="text-sm text-gray-500 mt-1">上传的课件和附件将自动归档至此文件夹</p>
                <p className="text-xs text-gray-400 mt-1">
                  归档结构示例: <code className="bg-gray-100 px-1 rounded text-gray-500">{localSettings.archiveFolder || '备课归档'}/2023-2024上/三年级数学/第三单元：测量</code>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                  {localSettings.archiveFolder || '未设置'}
                </span>
                <button 
                  onClick={handleSelectFolder}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  选择文件夹
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Template Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" />
              默认备课清单模板
            </h2>
            <p className="text-sm text-gray-500 mt-1">新建课时将默认包含以下备课子项，必须全部完成才能打勾</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 mb-6">
              {localSettings.defaultTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                  <span className="text-sm text-gray-700">{task}</span>
                  <button 
                    onClick={() => removeTask(index)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input 
                type="text" 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="输入新的备课子项，如：准备实验器材"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={addTask}
                disabled={!newTask.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
