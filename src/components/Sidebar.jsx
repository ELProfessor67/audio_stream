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
import {MdPlaylistAdd,MdOutlineLogout,MdOutlineAdminPanelSettings} from 'react-icons/md'
import {LiaAdSolid} from 'react-icons/lia'
import { usePathname } from 'next/navigation';
import Link from 'next/link'
import {logout} from '@/redux/action/user';
import {useDispatch,useSelector} from 'react-redux';
import {GiMusicalScore} from 'react-icons/gi'
import {toast} from 'react-toastify';


function checkInTimeRange(startTime,endTime){
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    const rangeStartHour = +startTime.split(':')[0];
    const rangeStartMinute = +startTime.split(':')[1];

    const rangeEndHour = +endTime.split(':')[0];
    const rangeEndMinute = +endTime.split(':')[1];

    const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

    console.log('range',timeInRange)

    return timeInRange;
}


const SidebarContext = createContext();

export const SidebarBody = ({children}) => {
    const [expanded, setExpanded] = useState(true);
    const {user} = useSelector(store => store.user);
  return (
    <aside className='h-screen'>
        <nav className='h-full flex flex-col bg-white border-r shadow-sm'>
            <div className='p-4 pb-2 flex justify-between items-center'>
                <Image src={'/images/logo.svg'} className={`
                    overflow-hidden transition-all
                    ${expanded ? "block w-28": "w-0 hidden"}
                 `} width={100} height={100}/>
                <button className={`p-1.5 rounded-lg bg-green-50 hover:bg-green-100 ${expanded ? "ml-0": "ml-2"}`} onClick={() => setExpanded(!expanded)}>
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
                        <h4 className='font-semibold'>{user?.name}</h4>
                        <span className='text-xs text-gray-600'>{user?.email}</span>
                    </div>
                    
                </div>
                {expanded && <FiMoreVertical side={60}/>}
                
            </div>

        </nav>
    </aside>
  )
}


export function SidebarItem({icon,text,active,alert,link='/',onClick}){
    const {expanded} = useContext(SidebarContext);
    return(<>
        <li onClick={onClick}>
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
    const dispatch = useDispatch();
    const {user} = useSelector(store => store.user);
    const handleLogout = async () => {
        dispatch(logout());
    }

    const isAllow = (permissionName) => {
        if(user?.isDJ){
            if(user?.djPermissions.includes(permissionName)){
                if(permissionName === 'live'){
                    const isTimeRange = checkInTimeRange(user?.djStartTime,user?.djEndTime);
                    return isTimeRange;
                }else{
                    return true
                }   
            }else{
               return false
            }
        }else{
            if(permissionName === 'playlists'){
                return false
            }else{
                return true
            } 
        }
    }


    const navigationsItems = [
        {
            icon: <RxDashboard size={30}/>,
            text: "Dashboard",
            alert: false,
            active: pathname == '/dashboard',
            link: '/dashboard',
            show: isAllow('dashboard')
        },
        {
            icon: <BsCloudUpload size={30}/>,
            text: "Uploads Song",
            alert: false,
            active: pathname == '/dashboard/songs/upload',
            link: '/dashboard/songs/upload',
            show: isAllow('songs')
    
        },
        {
            icon: <GiLoveSong size={30}/>,
            text: "My Uploaded Songs",
            alert: false,
            active: pathname == '/dashboard/songs',
            link: '/dashboard/songs',
            show: true
        },
        {
            icon: <MdPlaylistAdd size={30}/>,
            text: "Create Playlists",
            alert: false,
            active: pathname == '/dashboard/playlist-create',
            link: '/dashboard/playlist-create',
            show: true
    
        },
        {
            icon: <BsMusicNoteList size={30}/>,
            text: "My Created Playlists",
            alert: false,
            active: pathname == '/dashboard/playlist',
            link: '/dashboard/playlist',
            show: true
        },
        {
            icon: <MdOutlineAdminPanelSettings size={30}/>,
            text: "Admin Playlists",
            alert: false,
            active: pathname == '/dashboard/playlist-admin',
            link: '/dashboard/playlist-admin',
            show: isAllow('playlists')
    
        },
       
        
        {
            icon: <BsCalendarDate size={30}/>,
            text: "Schedules",
            alert: false,
            active: pathname == '/dashboard/shedules',
            link: '/dashboard/shedules',
            show: isAllow("schedules")
        },
        {
            icon: <PiUsersThreeDuotone size={30}/>,
            text: "My DJ Team",
            alert: false,
            active: pathname == '/dashboard/team',
            link: '/dashboard/team',
            show: isAllow('team')
        },
        {
            icon: <LiaAdSolid size={30}/>,
            text: "Ads Jingles",
            alert: false,
            active: pathname == '/dashboard/ads',
            link: '/dashboard/ads',
            show: isAllow('ads')
        },
        {
            icon: <GiMusicalScore size={30}/>,
            text: "Manage Filter Effects",
            alert: false,
            active: pathname == '/dashboard/filter',
            link: '/dashboard/filter',
            show: true
        },
        {
            icon: <BsMailbox size={30}/>,
            text: "Manage Live Playlist",
            alert: true,
            active: pathname == '/dashboard/manage-live',
            link: '/dashboard/manage-live',
            show: true
    
        },
        {
            icon: <CiStreamOn size={30}/>,
            text: "Start Streaming",
            alert: false,
            active: pathname == '/dashboard/go-live',
            link: '/dashboard/go-live',
            show: isAllow("live")
        },
        {
            icon: <FiSettings size={30}/>,
            text: "Welcome Tone",
            alert: false,
            active: pathname == '/dashboard/welcome-tone',
            link: '/dashboard/welcome-tone',
            show: true
        },
        {
            icon: <FiSettings size={30}/>,
            text: "Ending Tone",
            alert: false,
            active: pathname == '/dashboard/ending-tone',
            link: '/dashboard/ending-tone',
            show: true
        },
        
    ]
    return<>
    <SidebarBody>
        {
            navigationsItems.map((data) => data.show ? <SidebarItem {...data}/> :<HideLink {...data}/>)
        }

        <SidebarItem icon={<MdOutlineLogout size={30}/>} text={'Logout'} alert={false} link={''} active={false} onClick={handleLogout}/>
    </SidebarBody>
    </>
}



function HideLink({show,text,active,alert,icon}){

    const {expanded} = useContext(SidebarContext);
    const {user} = useSelector(store => store.user);
    function handleClick(){
        toast.info(`You go live only ${user?.djStartTime} to ${user?.djEndTime}`);
    }

    return(
        <>
            {
                text === "Go Live" &&
                <li onClick={handleClick}>
                    <a href={''} className={` 
                        relative flex items-center py-2 px-3 my-1
                        font-medium rounded-md cursor-pointer
                        transition-colors
                        text-gray-300 cursor-[not-allowed]
                        ${
                            active ?
                            "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
                            :"hover:bg-gray-50 text-gray-300"
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
                    </a>
                </li>
            }
        </>
    )

   
}
