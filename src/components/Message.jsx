import React from 'react'
import { MdStarRate } from "react-icons/md";

const Message = ({message,name,isOwner}) => {
  return (
    <div className={`flex flex-col gap-0 my-2 bg-gray-100 mx-2 rounded-md px-3 py-1`}>
        <h2 className='text-lg text-gray-900 flex items-center gap-1'>
          {isOwner && <MdStarRate size={20} color='yellow'/>}
          {name}
        </h2>
        <p className='para text-sm'>{message}</p>
    </div>
  )
}

export default Message