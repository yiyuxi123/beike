import React, { useState, useEffect } from 'react';
import { Lesson, Course, UserSettings } from '../types';
import { Copy, FileText, CheckCircle2, Search, Paperclip, ChevronDown, ChevronUp, FolderOpen, File, Image, FileArchive, FileAudio, FileVideo, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

interface AssetsViewProps {
  lessons: Lesson[];
  courses: Course[];
  settings: UserSettings;
  onDuplicate: (lesson: Lesson) => void;
}

interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  children?: FileNode[];
  path: string;
}

export default function AssetsView({ lessons, courses, settings, onDuplicate }: AssetsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'lessons' | 'files'>('files');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name: string } | null>(null);

  const completedLessons = lessons.filter(l => {
    if (l.status !== 'completed') return false;
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const course = courses.find(c => c.id === l.courseId);
    
    return (
      l.title.toLowerCase().includes(query) ||
      (course?.name.toLowerCase().includes(query)) ||
      l.attachments.some(a => a.name.toLowerCase().includes(query))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedLessonId(prev => prev === id ? null : id);
  };

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedFolders(newSet);
  };

  const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, currentPath: string = ''): Promise<FileNode[]> => {
    const nodes: FileNode[] = [];
    // @ts-ignore
    for await (const entry of dirHandle.values()) {
      const path = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === 'file') {
        nodes.push({ name: entry.name, kind: 'file', handle: entry, path });
      } else if (entry.kind === 'directory') {
        const children = await scanDirectory(entry, path);
        nodes.push({ name: entry.name, kind: 'directory', handle: entry, children, path });
      }
    }
    return nodes.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
  };

  const handleScan = async () => {
    if (!settings.archiveDirectoryHandle) return;
    setIsScanning(true);
    try {
      const options = { mode: 'read' as any };
      if ((await (settings.archiveDirectoryHandle as any).queryPermission(options)) !== 'granted') {
        if ((await (settings.archiveDirectoryHandle as any).requestPermission(options)) !== 'granted') {
          setIsScanning(false);
          return;
        }
      }
      const scannedFiles = await scanDirectory(settings.archiveDirectoryHandle);
      setFiles(scannedFiles);
      
      // Auto expand root folders
      const rootFolders = scannedFiles.filter(f => f.kind === 'directory').map(f => f.path);
      setExpandedFolders(new Set(rootFolders));
    } catch (e) {
      console.error("Failed to scan directory", e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (settings.archiveDirectoryHandle && activeTab === 'files') {
      handleScan();
    }
  }, [settings.archiveDirectoryHandle, activeTab]);

  const openFile = async (handle: FileSystemFileHandle) => {
    try {
      const file = await handle.getFile();
      const url = URL.createObjectURL(file);
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
        setPreviewFile({ url, type: 'image', name: file.name });
      } else if (['mp4', 'webm', 'mov'].includes(ext || '')) {
        setPreviewFile({ url, type: 'video', name: file.name });
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error("Failed to open file", e);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return <Image className="w-4 h-4 text-blue-500" />;
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return <FileVideo className="w-4 h-4 text-purple-500" />;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <FileAudio className="w-4 h-4 text-yellow-500" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return <FileArchive className="w-4 h-4 text-red-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return (
      <div className="space-y-1">
        {nodes.map(node => {
          if (node.kind === 'directory') {
            const isExpanded = expandedFolders.has(node.path);
            return (
              <div key={node.path}>
                <div 
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                  onClick={() => toggleFolder(node.path)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-sm text-gray-700">{node.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{node.children?.length || 0} 项</span>
                </div>
                <AnimatePresence>
                  {isExpanded && node.children && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {renderFileTree(node.children, level + 1)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          } else {
            if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;
            return (
              <div 
                key={node.path}
                className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group"
                style={{ paddingLeft: `${level * 1.5 + 2}rem` }}
                onClick={() => openFile(node.handle as FileSystemFileHandle)}
              >
                {getFileIcon(node.name)}
                <span className="text-sm text-gray-600 group-hover:text-blue-700 transition-colors truncate">{node.name}</span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">备课资产库</h1>
          <p className="text-gray-500 mt-2">沉淀教学智慧，自动分类管理备课文件</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              本地文件库
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'lessons' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              归档课时
            </button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件、教案..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 shadow-sm transition-shadow hover:shadow-md"
            />
          </div>
        </div>
      </div>

      {activeTab === 'files' ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              {settings.archiveFolder ? `当前归档目录: ${settings.archiveFolder}` : '未设置归档目录'}
            </div>
            <button 
              onClick={handleScan}
              disabled={!settings.archiveDirectoryHandle || isScanning}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? '扫描中...' : '刷新目录'}
            </button>
          </div>
          <div className="p-4 min-h-[400px]">
            {!settings.archiveDirectoryHandle ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
                <FolderOpen className="w-12 h-12 text-gray-300 mb-4" />
                <p className="mb-2">尚未连接本地归档文件夹</p>
                <p className="text-sm text-gray-400">请前往「设置」页面选择备课归档文件夹</p>
              </div>
            ) : files.length === 0 && !isScanning ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
                <File className="w-12 h-12 text-gray-300 mb-4" />
                <p>文件夹为空</p>
              </div>
            ) : (
              renderFileTree(files)
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedLessons.map(lesson => {
            const course = courses.find(c => c.id === lesson.courseId);
            return (
              <div key={lesson.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col hover:-translate-y-1">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-green-50 text-green-700 border border-green-100 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      已归档
                    </span>
                    <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">{formatDate(lesson.classTime)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 tracking-tight group-hover:text-blue-600 transition-colors">{lesson.title}</h3>
                  <p className="text-sm text-gray-500 mb-5 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">{course?.name}</span>
                    <span className="text-gray-300">•</span>
                    <span className="px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">{course?.term}</span>
                  </p>
                  
                  <div className="space-y-2">
                    <div 
                      className="flex items-center justify-between text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors bg-gray-50 p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100"
                      onClick={() => toggleExpand(lesson.id)}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>包含 {lesson.attachments.length} 个附件, {lesson.tasks.length} 项清单</span>
                      </div>
                      {expandedLessonId === lesson.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedLessonId === lesson.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                          {lesson.attachments.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wider">归档附件</h4>
                              <div className="space-y-2">
                                {lesson.attachments.map(att => (
                                  <div key={att.id} className="flex items-center gap-2.5 text-sm text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm">
                                    <Paperclip className="w-4 h-4 text-blue-500" />
                                    <span className="truncate font-medium">{att.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {lesson.tasks.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wider">备课清单记录</h4>
                              <div className="space-y-1.5">
                                {lesson.tasks.map(task => (
                                  <div key={task.id} className="flex items-start gap-2.5 text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{task.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="border-t border-gray-100 p-4 bg-gray-50/80 rounded-b-3xl">
                  <button 
                    onClick={() => onDuplicate(lesson)}
                    className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    复用到新学期
                  </button>
                </div>
              </div>
            );
          })}

          {completedLessons.length === 0 && (
            <div className="col-span-full py-24 text-center text-gray-500 bg-gradient-to-b from-gray-50/50 to-white rounded-3xl border border-gray-200 border-dashed">
              <div className="w-20 h-20 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-5 transform -rotate-3">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">资产库空空如也</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">完成备课打勾后，课时会自动归档到这里，方便未来复用。</p>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 bg-black/50 text-white absolute top-0 left-0 right-0 z-10">
                <span className="font-medium truncate pr-4">{previewFile.name}</span>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[50vh]">
                {previewFile.type === 'image' ? (
                  <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                ) : (
                  <video src={previewFile.url} controls className="max-w-full max-h-[80vh] rounded-lg" autoPlay />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
