import React, { useState } from 'react';
import Question from './components/Question';
import ButtonGrid from './components/ButtonGrid';

function AIPractice() {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    try {

      const response = await fetch(/*put the path here*/'', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ option }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit option');
      }
      console.log('Option submitted:', option);
    } catch (error) {
      console.error('Error submitting option:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* 
      1. Get the text message from AI
      2. parse and cut the message to appropriate format
      3. import here and place into the text="" */}
      <Question text="" />
      {/* There might be something between Question and Answer grid */}
      <ButtonGrid
        options={['a', 'b', 'c', 'd']}
        onOptionSelect={handleOptionSelect}
      />
    </div>
  );
}

export default AIPractice;