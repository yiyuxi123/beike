import React, { useState } from 'react';
import { mockCourses, mockLessons } from './data/mock';
import { Lesson, UserSettings } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import CalendarView from './components/CalendarView';
import AssetsView from './components/AssetsView';
import SettingsView from './components/SettingsView';
import ScheduleView from './components/ScheduleView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    reminderHours: 24,
    defaultTasks: [
      '教学目标已撰写',
      '教学PPT已上传',
      '随堂练习题已准备',
      '分层作业已设计'
    ]
  });

  const handleUpdateLesson = (updatedLesson: Lesson) => {
    setLessons(lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l));
  };

  const handleAddLesson = (newLesson: Omit<Lesson, 'id'>) => {
    const lesson: Lesson = {
      ...newLesson,
      id: `l_${Date.now()}`
    };
    setLessons([...lessons, lesson]);
  };

  const handleDuplicateLesson = (lesson: Lesson) => {
    const duplicatedLesson: Lesson = {
      ...lesson,
      id: `l_${Date.now()}`,
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

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-900 font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        courses={mockCourses}
        onSelectCourse={handleSelectCourse}
        selectedCourseId={selectedCourseId}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && <Dashboard courses={mockCourses} lessons={lessons} settings={settings} />}
        {activeTab === 'schedule' && <ScheduleView lessons={lessons} courses={mockCourses} settings={settings} onAddLesson={handleAddLesson} />}
        {activeTab === 'course' && selectedCourseId && (
          <CourseDetail 
            course={mockCourses.find(c => c.id === selectedCourseId)!} 
            lessons={lessons.filter(l => l.courseId === selectedCourseId)}
            settings={settings}
            onUpdateLesson={handleUpdateLesson}
            onAddLesson={handleAddLesson}
          />
        )}
        {activeTab === 'calendar' && <CalendarView lessons={lessons} courses={mockCourses} settings={settings} />}
        {activeTab === 'assets' && <AssetsView lessons={lessons} courses={mockCourses} onDuplicate={handleDuplicateLesson} />}
        {activeTab === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} />}
      </main>
    </div>
  );
}
