"use client"
import React, { createContext, useContext, useState } from 'react'
import Image from 'next/image'
import {TbChevronLeftPipe, TbChevronRightPipe} from 'react-icons/tb'
import {FiMoreVertical,FiSettings} from 'react-icons/fi'
import {RxDashboard} from 'react-icons/rx'
import {BsMusicNoteList,BsMailbox, BsCloudUpload, BsCalendarDate} from 'react-icons/bs'
import {PiUsersThreeDuotone} from 'react-icons/pi'
import {CiStreamOn} from 'react-icons/ci'
import {GiLoveSong} from 'react-icons/gi'
import {MdPlaylistAdd} from 'react-icons/md'
import { usePathname } from 'next/navigation';
import Link from 'next/link'


const SidebarContext = createContext();

export const SidebarBody = ({children}) => {
    const [expanded, setExpanded] = useState(true);
  return (
    <aside className='h-screen'>
        <nav className='h-full flex flex-col bg-white border-r shadow-sm'>
            <div className='p-4 pb-2 flex justify-between items-center'>
                <Image src={'/next.svg'} className={`
                    overflow-hidden transition-all
                    ${expanded ? "w-32": "w-0"}
                 `} width={100} height={100}/>
                <button className='p-1.5 rounded-lg bg-green-50 hover:bg-green-100' onClick={() => setExpanded(!expanded)}>
                    {expanded ? <TbChevronLeftPipe size={30}/> : <TbChevronRightPipe size={30}/> }
                </button>
            </div>

            <SidebarContext.Provider value={{expanded}}>
                <ul className='flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden'>
                {children}
                </ul>
            </SidebarContext.Provider>

            <div className='border-r flex p-3 justify-between items-center'>
                <Image src={'/vercel.svg'} className='w-14 h-14 rounded-md' width={102} height={100}/>
                <div className={`flex justify-center items-center
                overflow-hidden transition-all
                ${expanded ? "w-52 ml-3": "w-0"}
                `}>
                    <div>
                        <h4 className='font-semibold'>Zeeshan Raza</h4>
                        <span className='text-xs text-gray-600'>jeeshanr599@gmail.com</span>
                    </div>
                    
                </div>
                {expanded && <FiMoreVertical side={60}/>}
                
            </div>

        </nav>
    </aside>
  )
}


export function SidebarItem({icon,text,active,alert,link='/'}){
    const {expanded} = useContext(SidebarContext);
    return(<>
        <li>
            <Link href={link} className={` 
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors
                ${
                    active ?
                    "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
                    :"hover:bg-indigo-50 text-gray-600"
                }
            `}>
                {icon}
                <span className={`overflow-hidden transition-all ${
                    expanded ? "w-52 ml-3": "w-0"
                }`}>{text}</span>
                {
                    alert && (
                        <div className={`absolute right-2 w-2 h-2 rounded-full bg-indigo-400 ${
                            expanded ? "": "top-2"
                        }`}/>
                    )
                }

                {
                    !expanded && <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100`}>
                        {text}
                    </div>
                }
            </Link>
        </li>
    </>);

}

export default function Sidebar(){
    const pathname = usePathname();
    const navigationsItems = [
        {
            icon: <RxDashboard size={30}/>,
            text: "Dashboard",
            alert: false,
            active: pathname == '/dashboard',
            link: '/dashboard'
        },
        {
            icon: <BsMusicNoteList size={30}/>,
            text: "My Playlists",
            alert: false,
            active: pathname == '/dashboard/playlist',
            link: '/dashboard/playlist'
    
        },
        {
            icon: <MdPlaylistAdd size={30}/>,
            text: "Create Playlists",
            alert: false,
            active: pathname == '/dashboard/playlist-create',
            link: '/dashboard//playlist-create'
    
        },
        {
            icon: <GiLoveSong size={30}/>,
            text: "My Songs",
            alert: false,
            active: pathname == '/dashboard/songs',
            link: '/dashboard/songs'
    
        },
        {
            icon: <BsCloudUpload size={30}/>,
            text: "Uploads Song",
            alert: false,
            active: pathname == '/dashboard/songs/upload',
            link: '/dashboard/songs/upload'
    
        },
        {
            icon: <BsCalendarDate size={30}/>,
            text: "Schedules",
            alert: false,
            active: pathname == '/dashboard/shedules',
            link: '/dashboard/shedules'
        },
        {
            icon: <PiUsersThreeDuotone size={30}/>,
            text: "My Team",
            alert: false,
            active: pathname == '/dashboard/team',
            link: '/dashboard/team'
    
        },
        {
            icon: <BsMailbox size={30}/>,
            text: "Requests",
            alert: true,
            active: pathname == '/dashboard/requests',
            link: '/dashboard/requests'
    
        },
        {
            icon: <CiStreamOn size={30}/>,
            text: "Go Live",
            alert: false,
            active: pathname == '/dashboard/go-live',
            link: '/dashboard/go-live'
    
        },
        {
            icon: <FiSettings size={30}/>,
            text: "Settings",
            alert: false,
            active: pathname == '/dashboard/settings',
            link: '/dashboard/settings'
        },
        
    ]
    return<>
    <SidebarBody>
        {
            navigationsItems.map((data) => <SidebarItem {...data}/>)
        }
    </SidebarBody>
    </>
}