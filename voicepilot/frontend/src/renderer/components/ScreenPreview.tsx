import React, { useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface ScreenPreviewProps {
  screenshot: string | null;
  selection: { x: number; y: number; width: number; height: number } | null;
  onCapture: (imageData: string) => void;
}

export const ScreenPreview: React.FC<ScreenPreviewProps> = ({
  screenshot,
  selection,
  onCapture,
}) => {
  const [sources, setSources] = useState<Array<{ id: string; name: string; thumbnail: string }>>([]);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const loadSources = async () => {
    try {
      const availableSources = await window.electronAPI.getScreenSources();
      setSources(availableSources);
      setShowSourcePicker(true);
    } catch (error) {
      console.error('Failed to load screen sources:', error);
    }
  };

  const handleCapture = async (sourceId: string) => {
    try {
      const result = await window.electronAPI.captureScreen(sourceId);
      if (result.success) {
        // For demo, use a mock image
        onCapture('mock-screenshot-data');
        setShowSourcePicker(false);
      }
    } catch (error) {
      console.error('Failed to capture screen:', error);
    }
  };

  if (!screenshot) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Screen Preview
        </h3>
        <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
          <ImageIcon className="w-12 h-12 mb-2" />
          <p className="text-sm">No screenshot captured</p>
          <p className="text-xs mt-1">Click "Capture Screen" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Screen Preview
        </h3>
        <button
          onClick={loadSources}
          className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Change Source
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
        <div className="text-center text-slate-400">
          <ImageIcon className="w-16 h-16 mx-auto mb-2" />
          <p className="text-sm">Screen captured</p>
          <p className="text-xs mt-1">Selection: {selection ? `${Math.round(selection.width)}×${Math.round(selection.height)}` : 'Full screen'}</p>
        </div>
        
        {/* Selection overlay */}
        {selection && (
          <div
            className="absolute border-2 border-purple-500 bg-purple-500/10 pointer-events-none"
            style={{
              left: `${(selection.x / 1920) * 100}%`,
              top: `${(selection.y / 1080) * 100}%`,
              width: `${(selection.width / 1920) * 100}%`,
              height: `${(selection.height / 1080) * 100}%`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-purple-500 text-white text-xs px-2 py-0.5 rounded">
              {Math.round(selection.width)}×{Math.round(selection.height)}
            </div>
          </div>
        )}
      </div>

      {/* Source Picker Modal */}
      {showSourcePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold">Select Screen Source</h3>
              <button
                onClick={() => setShowSourcePicker(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                {sources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => handleCapture(source.id)}
                    className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                  >
                    <img
                      src={source.thumbnail}
                      alt={source.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-sm font-medium truncate">
                        {source.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};