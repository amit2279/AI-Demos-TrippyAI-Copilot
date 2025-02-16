import React, { useState } from 'react';
import { CloudSun, Map, Plane, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface QuickActionsPanelProps {
  onActionClick: (action: string) => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onActionClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`absolute bottom-[72px] left-0 right-0 z-30 transition-transform duration-300 ease-in-out ${
      isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-4px)]'
    }`}>
      {/* Panel Content */}
      <div className="bg-white shadow-md border-t border-gray-200">
        {/* Dog Ear Toggle */}
        <div className="absolute -top-6 right-4 z-40">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white rounded-t-lg px-4 py-1 border border-b-0 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-600" />
            ) : (
              <ChevronUp size={16} className="text-gray-600" />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between items-center gap-2 p-3">
          <button
            onClick={() => onActionClick('weather')}
            className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CloudSun size={20} className="text-blue-500 mb-1" />
            <span className="text-xs text-gray-600">Weather</span>
          </button>
          
         {/* {  <button
            onClick={() => onActionClick('plan')}
            className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar size={20} className="text-green-500 mb-1" />
            <span className="text-xs text-gray-600">Plan Trip</span>
          </button> } */}
          
          <button
            onClick={() => onActionClick('find')}
            className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Map size={20} className="text-purple-500 mb-1" />
            <span className="text-xs text-gray-600">Find Place</span>
          </button>
          
        {/* {   <button
            onClick={() => onActionClick('flights')}
            className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plane size={20} className="text-orange-500 mb-1" />
            <span className="text-xs text-gray-600">Flights</span>
          </button> } */}
        </div>
      </div>
    </div>
  );
};