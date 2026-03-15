import React, { useState, useEffect } from 'react';
import { Folder, FileCode, RefreshCw, CheckCircle } from 'lucide-react';

interface DemoProjectProps {
  onFileChange: () => void;
}

interface FileInfo {
  name: string;
  path: string;
  content: string;
}

export const DemoProject: React.FC<DemoProjectProps> = ({ onFileChange }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.getDemoFiles();
      if (result.success && result.files) {
        setFiles(result.files);
        if (result.files.length > 0 && !selectedFile) {
          setSelectedFile(result.files[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: FileInfo) => {
    setSelectedFile(file);
  };

  const handleRefresh = () => {
    loadFiles();
    setLastUpdated(new Date());
    onFileChange();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Folder className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Demo Project</h3>
            <p className="text-xs text-slate-500">Example React components</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 min-h-[400px]">
        {/* File List */}
        <div className="col-span-1 border-r border-slate-200 bg-slate-50">
          <div className="p-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Files
            </p>
            
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleFileSelect(file)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedFile?.name === file.name
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileCode className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
              
              {files.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No files found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* File Content */}
        <div className="col-span-2 bg-slate-900">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              {/* File Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">
                    {selectedFile.name}
                  </span>
                </div>
                
                {lastUpdated && (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Updated
                  </div>
                )}
              </div>
              
              {/* Code Content */}
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                  {selectedFile.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <p>Select a file to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};