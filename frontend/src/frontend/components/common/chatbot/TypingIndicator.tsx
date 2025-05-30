import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 pl-10">
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300 [animation-delay:-0.3s]" />      
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300 [animation-delay:-0.15s]" />      
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300" />    
    </div>
  );
}