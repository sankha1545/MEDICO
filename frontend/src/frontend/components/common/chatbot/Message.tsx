import React from 'react';

export default function Message({ role, avatar, content }: { role: string; avatar: string; content: string; }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>      
      {!isUser && <img src={avatar} alt="bot" className="mr-2 h-8 w-8 rounded-full object-cover" />}      
      <div className={`rounded-2xl px-4 py-2 text-sm shadow ${isUser ? 'bg-blue-100 text-blue-700 rounded-br-none' : 'bg-white/80 text-gray-800 rounded-bl-none'} max-w-[75%]`}>        {content}      
      </div>      
      {isUser && <img src={avatar} alt="user" className="ml-2 h-8 w-8 rounded-full object-cover" />}    
    </div>
  );
}