'use client';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  stage: string;
  isVisible: boolean;
  className?: string;
  fileSize?: number; // in bytes
  fileName?: string;
}

export default function ProgressIndicator({ 
  progress, 
  stage, 
  isVisible, 
  className = '',
  fileSize,
  fileName
}: ProgressIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 ${className}`}>
      <div className="space-y-4">
        {/* Stage Description */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-100">{stage}</h3>
          <span className="text-sm text-gray-400">{progress}%</span>
        </div>

        {/* File Information */}
        {(fileName || fileSize) && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            {fileName && <span>File: {fileName}</span>}
            {fileSize && (
              <span>
                Size: {fileSize >= 1024 * 1024 
                  ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` 
                  : `${(fileSize / 1024).toFixed(1)} KB`
                }
              </span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          {/* Animated shimmer effect during processing */}
          {progress > 0 && progress < 100 && (
            <div className="absolute inset-0 h-3 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-shimmer" />
          )}
        </div>

        {/* Progress Details */}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          {progress < 100 ? (
            <>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Complete</span>
            </>
          )}
        </div>

        {/* Processing stages indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex space-x-4">
            <div className={`flex items-center space-x-1 ${
              stage.includes('Uploading') ? 'text-blue-400' : 
              stage.includes('Processing') || stage.includes('Finalizing') ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                stage.includes('Uploading') ? 'bg-blue-400 animate-pulse' : 
                stage.includes('Processing') || stage.includes('Finalizing') ? 'bg-gray-400' : 'bg-gray-600'
              }`} />
              <span>Upload</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${
              stage.includes('Processing') ? 'text-violet-400' : 
              stage.includes('Finalizing') ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                stage.includes('Processing') ? 'bg-violet-400 animate-pulse' : 
                stage.includes('Finalizing') ? 'bg-gray-400' : 'bg-gray-600'
              }`} />
              <span>AI Analysis</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${
              stage.includes('Finalizing') ? 'text-green-400' : 'text-gray-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                stage.includes('Finalizing') ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
              }`} />
              <span>Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}