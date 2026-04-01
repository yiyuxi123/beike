import React, { useState } from 'react';
import { mockCourses, mockLessons } from './data/mock';
import { Course, Lesson, UserSettings } from './types';
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

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-900 font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        courses={courses}
        onSelectCourse={handleSelectCourse}
        selectedCourseId={selectedCourseId}
        settings={settings}
      />
      <main className="flex-1 overflow-y-auto p-8">
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
        {activeTab === 'assets' && <AssetsView lessons={lessons} courses={courses} onDuplicate={handleDuplicateLesson} />}
        {activeTab === 'settings' && <SettingsView settings={settings} onUpdateSettings={setSettings} courses={courses} onUpdateCourses={handleUpdateCourses} />}
      </main>
    </div>
  );
}
