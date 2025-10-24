'use client';

interface AnalysisControlsProps {
  isLoading: boolean;
  isCompressing: boolean;
  onAnalyze: () => void;
  onClear: () => void;
}

export default function AnalysisControls({
  isLoading,
  isCompressing,
  onAnalyze,
  onClear,
}: AnalysisControlsProps) {
  return (
    <div className="flex items-center justify-center space-x-6">
      <button
        onClick={onAnalyze}
        disabled={isLoading}
        className={`px-10 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
          isLoading
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-violet-500/25 transform hover:scale-105'
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>{isCompressing ? 'Compressing...' : 'Analyzing...'}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Analyze Meeting</span>
          </>
        )}
      </button>

      <button
        onClick={onClear}
        disabled={isLoading}
        className="px-6 py-4 rounded-xl font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all duration-200"
      >
        Clear
      </button>
    </div>
  );
}
