import React, { useState } from 'react';

interface ProjectDatePickerProps {
  startDate?: string;
  endDate?: string;
  onDatesChange: (startDate: string, endDate: string, durationDays: number) => void;
}

export const ProjectDatePicker: React.FC<ProjectDatePickerProps> = ({
  startDate = '',
  endDate = '',
  onDatesChange
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // Calculate duration in days
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const handleStartDateChange = (newStart: string) => {
    setLocalStartDate(newStart);
    
    // If end date is before start date, adjust it
    if (localEndDate && newStart > localEndDate) {
      const nextDay = new Date(newStart);
      nextDay.setDate(nextDay.getDate() + 1);
      const adjustedEnd = nextDay.toISOString().split('T')[0];
      setLocalEndDate(adjustedEnd);
      onDatesChange(newStart, adjustedEnd, calculateDuration(newStart, adjustedEnd));
    } else {
      onDatesChange(newStart, localEndDate, calculateDuration(newStart, localEndDate));
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setLocalEndDate(newEnd);
    onDatesChange(localStartDate, newEnd, calculateDuration(localStartDate, newEnd));
  };

  const duration = calculateDuration(localStartDate, localEndDate);

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons text-blue-600">calendar_today</span>
        <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={today}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={localStartDate || today}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Duration Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <div className="flex items-center h-10 px-4 py-2 bg-white border border-gray-300 rounded-lg">
            {duration > 0 ? (
              <span className="text-gray-900 font-semibold">
                {duration} {duration === 1 ? 'day' : 'days'}
              </span>
            ) : (
              <span className="text-gray-400">Select dates</span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      {localStartDate && localEndDate && duration > 0 && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="material-icons text-green-600 text-sm">play_circle</span>
              <span className="text-gray-600">
                {new Date(localStartDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>

            <div className="flex-1 mx-4">
              <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full relative">
                <div className="absolute -top-1 left-0 w-4 h-4 bg-green-600 rounded-full"></div>
                <div className="absolute -top-1 right-0 w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                {new Date(localEndDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              <span className="material-icons text-blue-600 text-sm">flag</span>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
        <span className="material-icons text-sm mt-0.5">info</span>
        <p>
          When team members accept their assignments, these dates will be automatically added to their Google Calendar.
        </p>
      </div>
    </div>
  );
};
