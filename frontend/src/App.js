import React from 'react';
import StrategyGenerator from './StrategyGenerator';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StrategyGenerator />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;