import React, { useState } from 'react';
import TimerEntries from './tabs/TimeEntries';
import Statistics from './tabs/Statistics';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'statistics'>('timer');

  return (
    <div className="p-4 py-2 bg-white max-w-[500px] w-[500px] flex flex-col h-[300px] h-max-[300px]">
      <div className="mb-4 flex justify-around w-full border-b border-gray-200 relative">
        <button
          className={`w-1/2 py-2 text-center ${
            activeTab === 'timer' ? 'text-teal-500 font-bold shadow-lg' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('timer')}
        >
          Timer
        </button>
        <button
          className={`w-1/2 py-2 text-center ${
            activeTab === 'statistics'
              ? 'text-teal-500 font-bold shadow-lg'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
        <div
          className={`absolute bottom-0 left-0 w-1/2 h-px bg-teal-500 transition-transform duration-100 ${
            activeTab === 'statistics' && 'translate-x-full'
          }`}
        />
      </div>
      {activeTab === 'timer' && <TimerEntries />}
      {activeTab === 'statistics' && <Statistics />}
    </div>
  );
};

export default App;
