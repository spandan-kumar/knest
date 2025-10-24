'use client';

interface RecordingTabProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function RecordingTab({
  isRecording,
  onStartRecording,
  onStopRecording,
}: RecordingTabProps) {
  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="flex space-x-6">
        <button
          onClick={onStartRecording}
          disabled={isRecording}
          className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
            isRecording
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25 transform hover:scale-105'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
          <span>{isRecording ? 'Recording...' : 'Start Recording'}</span>
        </button>

        <button
          onClick={onStopRecording}
          disabled={!isRecording}
          className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
            !isRecording
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600 shadow-lg transform hover:scale-105'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
              clipRule="evenodd"
            />
          </svg>
          <span>Stop Recording</span>
        </button>
      </div>

      {isRecording && (
        <div className="flex items-center space-x-3 text-red-400">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Recording in progress...</span>
        </div>
      )}
    </div>
  );
}
