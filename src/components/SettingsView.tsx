import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Bell, Volume2, ListTodo, Plus, Trash2, Save, CheckCircle2, FolderOpen } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export default function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [newTask, setNewTask] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    onUpdateSettings(localSettings);
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
