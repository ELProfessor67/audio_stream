import React from 'react'
import { MdStarRate } from "react-icons/md";

const formatTime = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// One chat line. The DJ's own messages (isOwner) sit on the right in indigo,
// listeners' on the left in white, like any messenger.
const Message = ({ message, name, isOwner, date }) => {
  return (
    <div className={`flex my-1.5 mx-2 ${isOwner ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${isOwner ? 'bg-indigo-500 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isOwner ? 'text-indigo-100' : 'text-gray-600'}`}>
          {isOwner && <MdStarRate size={14} />}
          <span className="truncate max-w-[14rem]">{name || (isOwner ? 'You' : 'Listener')}</span>
          {date && <span className={`ml-2 font-normal ${isOwner ? 'text-indigo-200' : 'text-gray-400'}`}>{formatTime(date)}</span>}
        </div>
        <p className="text-sm break-words whitespace-pre-wrap mt-0.5">{message}</p>
      </div>
    </div>
  )
}

export default Message
