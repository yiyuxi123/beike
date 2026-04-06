import React, { useState } from 'react';
import { BookOpen, Calendar, LayoutDashboard, Library, Settings, CheckCircle, CalendarDays, Search, Plus, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { Course, UserSettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  courses: Course[];
  onSelectCourse: (id: string) => void;
  selectedCourseId: string | null;
  settings?: UserSettings;
  onOpenSearch?: () => void;
  onQuickAdd?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, courses, onSelectCourse, selectedCourseId, settings, onOpenSearch, onQuickAdd }: SidebarProps) {
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const activeCourses = courses.filter(c => !c.isArchived);
  const archivedCourses = courses.filter(c => c.isArchived);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">备课印记</h1>
        </div>
        {onOpenSearch && (
          <button onClick={onOpenSearch} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="全局搜索 (Cmd/Ctrl + K)">
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 pb-6 flex-1 overflow-y-auto">
        {onQuickAdd && (
          <button 
            onClick={onQuickAdd}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors mb-6 shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            快速添加课时
          </button>
        )}
        <div className="space-y-1 mb-8">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="工作台" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<CalendarDays className="w-5 h-5" />} 
            label="课表排期" 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')} 
          />
          <NavItem 
            icon={<Calendar className="w-5 h-5" />} 
            label="备课本日历" 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
          />
          <NavItem 
            icon={<Library className="w-5 h-5" />} 
            label="备课资产库" 
            active={activeTab === 'assets'} 
            onClick={() => setActiveTab('assets')} 
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">我的课程</h2>
          <div className="space-y-1">
            {activeCourses.map(course => (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  activeTab === 'course' && selectedCourseId === course.id
                  ? 'bg-blue-50 text-blue-700 font-medium shadow-sm shadow-blue-100/50' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <BookOpen className={`w-4 h-4 transition-colors ${activeTab === 'course' && selectedCourseId === course.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="truncate">{course.name}</span>
              </button>
            ))}
          </div>
        </div>

        {archivedCourses.length > 0 && (
          <div>
            <button 
              onClick={() => setIsArchivedOpen(!isArchivedOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3 hover:text-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5" />
                <span>归档课程</span>
              </div>
              {isArchivedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            
            {isArchivedOpen && (
              <div className="space-y-1 mt-2">
                {archivedCourses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      activeTab === 'course' && selectedCourseId === course.id
                      ? 'bg-gray-100 text-gray-800 font-medium' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Archive className={`w-4 h-4 transition-colors ${activeTab === 'course' && selectedCourseId === course.id ? 'text-gray-600' : 'text-gray-400'}`} />
                    <span className="truncate">{course.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        {settings?.personalInfo && (
          <div className="flex items-center gap-3 mb-4 px-2 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 shadow-sm border border-blue-100">
              {settings.personalInfo.name.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{settings.personalInfo.name}</div>
              <div className="text-xs text-gray-500 truncate">{settings.personalInfo.school}</div>
            </div>
          </div>
        )}
        <NavItem 
          icon={<Settings className="w-5 h-5" />} 
          label="设置" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
        active 
          ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <div className={`w-5 h-5 transition-colors ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}
