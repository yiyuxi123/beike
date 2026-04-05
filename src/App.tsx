import React, { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { mockCourses, mockLessons } from './data/mock';
import { Course, Lesson, UserSettings } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import CalendarView from './components/CalendarView';
import AssetsView from './components/AssetsView';
import SettingsView from './components/SettingsView';
import ScheduleView from './components/ScheduleView';
import GlobalSearch from './components/GlobalSearch';
import QuickAddLessonModal from './components/QuickAddLessonModal';
import { getDirectoryHandle } from './utils/indexedDB';

const STORAGE_KEY = 'teacher-prep-data';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    reminderHours: 24,
    defaultTasks: [
      '教学目标已撰写',
      '教学PPT已上传',
      '随堂练习题已准备',
      '分层作业已设计'
    ],
    personalInfo: {
      name: '张老师',
      title: '高级数学教师',
      school: '第一实验小学'
    },
    timetableSlots: [
      { id: 'ts_1', name: '第一节', startTime: '08:00', endTime: '08:45' },
      { id: 'ts_2', name: '第二节', startTime: '08:55', endTime: '09:40' },
      { id: 'ts_3', name: '第三节', startTime: '10:00', endTime: '10:45' },
      { id: 'ts_4', name: '第四节', startTime: '10:55', endTime: '11:40' },
      { id: 'ts_5', name: '第五节', startTime: '14:00', endTime: '14:45' },
      { id: 'ts_6', name: '第六节', startTime: '14:55', endTime: '15:40' },
    ]
  });

  useEffect(() => {
    const loadData = async () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      let loadedSettings = { ...settings };
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.courses) setCourses(parsed.courses);
          if (parsed.lessons) setLessons(parsed.lessons);
          if (parsed.settings) {
            loadedSettings = { ...loadedSettings, ...parsed.settings };
          }
        } catch (e) {
          console.error("Failed to load data from local storage", e);
        }
      }
      
      try {
        const handle = await getDirectoryHandle();
        if (handle) {
          // Verify permission
          const options = { mode: 'readwrite' as any };
          if ((await (handle as any).queryPermission(options)) === 'granted') {
            loadedSettings.archiveDirectoryHandle = handle;
          } else {
            // We might need to request permission later when user interacts
            loadedSettings.archiveDirectoryHandle = handle;
          }
        }
      } catch (e) {
        console.error("Failed to load directory handle", e);
      }
      
      setSettings(loadedSettings);
      setIsLoaded(true);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const dataToSave = {
        courses,
        lessons,
        settings: {
          ...settings,
          archiveDirectoryHandle: undefined // Exclude from serialization
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [courses, lessons, settings, isLoaded]);

  const handleExportData = () => {
    const dataToExport = {
      courses,
      lessons,
      settings: {
        ...settings,
        archiveDirectoryHandle: undefined
      }
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-prep-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    if (data && typeof data === 'object') {
      if (Array.isArray(data.courses)) setCourses(data.courses);
      if (Array.isArray(data.lessons)) setLessons(data.lessons);
      if (data.settings && typeof data.settings === 'object') {
        setSettings({
          ...settings,
          ...data.settings,
          archiveDirectoryHandle: undefined
        });
      }
    }
  };

  const handleUpdateCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    const courseIds = new Set(newCourses.map(c => c.id));
    setLessons(prevLessons => prevLessons.filter(l => courseIds.has(l.courseId)));
    
    if (selectedCourseId && !courseIds.has(selectedCourseId)) {
      setSelectedCourseId(null);
      setActiveTab('dashboard');
    }
  };

  const handleUpdateLesson = (updatedLesson: Lesson) => {
    setLessons(lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l));
  };

  const handleDeleteLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleAddLesson = (newLesson: Omit<Lesson, 'id'>) => {
    const lesson: Lesson = {
      ...newLesson,
      id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setLessons([...lessons, lesson]);
  };

  const handleAddMultipleLessons = (newLessons: Lesson[]) => {
    setLessons([...lessons, ...newLessons]);
  };

  const handleDuplicateLesson = (lesson: Lesson) => {
    const duplicatedLesson: Lesson = {
      ...lesson,
      id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${lesson.title} (复用)`,
      status: 'not_started',
      classTime: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
      tasks: lesson.tasks.map(t => ({ ...t, completed: false }))
    };
    setLessons([...lessons, duplicatedLesson]);
    alert('已成功复用到新学期！(默认安排在7天后，请到课程详情中修改)');
  };

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    setActiveTab('course');
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-900 font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        courses={courses}
        onSelectCourse={handleSelectCourse}
        selectedCourseId={selectedCourseId}
        settings={settings}
        onOpenSearch={() => setIsSearchOpen(true)}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />
      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'dashboard' && <Dashboard courses={courses} lessons={lessons} settings={settings} onSelectCourse={handleSelectCourse} />}
        {activeTab === 'schedule' && <ScheduleView lessons={lessons} courses={courses} settings={settings} onAddLesson={handleAddLesson} onAddMultipleLessons={handleAddMultipleLessons} onDeleteLesson={handleDeleteLesson} />}
        {activeTab === 'course' && selectedCourseId && (
          <CourseDetail 
            course={courses.find(c => c.id === selectedCourseId)!} 
            lessons={lessons.filter(l => l.courseId === selectedCourseId)}
            settings={settings}
            onUpdateLesson={handleUpdateLesson}
            onAddLesson={handleAddLesson}
            onDeleteLesson={handleDeleteLesson}
          />
        )}
        {activeTab === 'calendar' && <CalendarView lessons={lessons} courses={courses} settings={settings} onAddLesson={handleAddLesson} onUpdateLesson={handleUpdateLesson} onDeleteLesson={handleDeleteLesson} />}
        {activeTab === 'assets' && <AssetsView lessons={lessons} courses={courses} settings={settings} onDuplicate={handleDuplicateLesson} />}
        {activeTab === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} courses={courses} onUpdateCourses={handleUpdateCourses} onImportData={handleImportData} onExportData={handleExportData} />}
      </main>

      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        courses={courses} 
        lessons={lessons} 
        onSelectCourse={handleSelectCourse} 
      />

      <QuickAddLessonModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        courses={courses}
        onAddLesson={handleAddLesson}
      />
      <SpeedInsights />
    </div>
  );
}
