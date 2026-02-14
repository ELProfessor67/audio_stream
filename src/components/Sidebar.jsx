"use client"
import React, { createContext, useContext, useState } from 'react'
import Image from 'next/image'
import { TbChevronLeftPipe, TbChevronRightPipe } from 'react-icons/tb'
import { FiMoreVertical, FiSettings } from 'react-icons/fi'
import { RxDashboard } from 'react-icons/rx'
import { BsMusicNoteList, BsMailbox, BsCloudUpload, BsCalendarDate } from 'react-icons/bs'
import { PiUsersThreeDuotone } from 'react-icons/pi'
import { CiStreamOn } from 'react-icons/ci'
import { GiLoveSong } from 'react-icons/gi'
import { MdPlaylistAdd, MdOutlineLogout, MdOutlineAdminPanelSettings } from 'react-icons/md'
import { LiaAdSolid } from 'react-icons/lia'
import { usePathname } from 'next/navigation';
import Link from 'next/link'
import { logout } from '@/redux/action/user';
import { useDispatch, useSelector } from 'react-redux';
import { GiMusicalScore } from 'react-icons/gi'
import { toast } from 'react-toastify';
import { current } from '@reduxjs/toolkit'
import { HiOutlineAdjustmentsVertical } from "react-icons/hi2";
import { CgEditFade } from 'react-icons/cg'



function convertUTCToLocalTime(utctime) {
    // Split the input time string into hours and minutes
    const [hourStr, minuteStr] = utctime.split(':');

    // Parse hours and minutes as integers
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Create a new Date object with UTC time
    const utcDate = new Date();
    utcDate.setUTCHours(hour);
    utcDate.setUTCMinutes(minute);

    // Format local time in 24-hour format
    const localHour = utcDate.getHours().toString().padStart(2, '0');
    const localMinute = utcDate.getMinutes().toString().padStart(2, '0');

    return `${localHour}:${localMinute}`;
}


function isToday(year, month, date) {
    const Currntdate = new Date();
    if (+year == Currntdate.getFullYear() && +month == Currntdate.getMonth() + 1 && +date == Currntdate.getDate()) {
        return true;
    } else {
        return false;
    }
}


function checkInTimeRange(startTime, endTime, date) {
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();

    // check date 
    const [userYear, userMonth, userDate] = date?.split('-');


    const rangeStartHour = +startTime?.split(':')[0];
    const rangeStartMinute = +startTime?.split(':')[1];

    const rangeEndHour = +endTime?.split(':')[0];
    const rangeEndMinute = +endTime?.split(':')[1];

    const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

    console.log('range', timeInRange)

    if (isToday(userYear, userMonth, userDate) && timeInRange) {
        return true;
    } else {
        return false;
    }
    // return timeInRange;
}


function checkInTimeRangeForDay(startTime, endTime, user) {
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();


    const rangeStartHour = +startTime?.split(':')[0];
    const rangeStartMinute = +startTime?.split(':')[1];

    const rangeEndHour = +endTime?.split(':')[0];
    const rangeEndMinute = +endTime?.split(':')[1];

    const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

    const checkDay = user?.djDays?.includes((new Date().getDay()).toString())
    if (checkDay && timeInRange) {
        return true;
    } else {
        return false;
    }
    // return timeInRange;
}


const SidebarContext = createContext();

export const SidebarBody = ({ children }) => {
    const [expanded, setExpanded] = useState(false);
    const { user } = useSelector(store => store.user);
    return (
        <aside className='h-screen'>
            <nav className='h-full flex flex-col bg-white border-r shadow-sm'>
                <div className='p-4 pb-2 flex justify-between items-center'>
                    <Image src={'/images/logo.svg'} className={`
                    overflow-hidden transition-all
                    ${expanded ? "block w-28" : "w-0 hidden"}
                 `} width={100} height={100} />
                    <button className={`p-1.5 rounded-lg bg-green-50 hover:bg-green-100 ${expanded ? "ml-0" : "ml-2"}`} onClick={() => setExpanded(!expanded)}>
                        {expanded ? <TbChevronLeftPipe size={30} /> : <TbChevronRightPipe size={30} />}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className='flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden'>
                        {children}
                    </ul>
                </SidebarContext.Provider>

                <div className='border-r flex p-3 justify-between items-center'>
                    <Image src={'/vercel.svg'} className='w-14 h-14 rounded-md' width={102} height={100} />
                    <div className={`flex justify-center items-center
                overflow-hidden transition-all
                ${expanded ? "w-52 ml-3" : "w-0"}
                `}>
                        <div>
                            <h4 className='font-semibold'>{user?.name}</h4>
                            <span className='text-xs text-gray-600'>{user?.email}</span>
                        </div>

                    </div>
                    {expanded && <FiMoreVertical side={60} />}

                </div>

            </nav>
        </aside>
    )
}


export function SidebarItem({ icon, text, active, alert, link = '/', onClick, desc }) {
    const { expanded } = useContext(SidebarContext);
    const pathname = usePathname();

    const handleOpen = (link) => {
        if (pathname.includes("/go-live") && link == "/dashboard/go-live") {
            return
        }

        if (pathname.includes("/go-live")) {
            window.open(link, '_blank', 'width=700,height=700');
        } else {
            window.open(link, '_blank');
        }
    }

    return (<>
        <li onClick={onClick}>
            {
                text == "Logout"
                    ? <button target='_blank' title={text} className={` 
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors
                ${active ?
                            "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
                            : "hover:bg-indigo-50 text-gray-600"
                        }
            `}>
                        {icon}
                        <span className={`overflow-hidden transition-all flex justify-between items-center ${expanded ? "w-52 ml-3" : "w-0"
                            }`}>{text} <button className='text-sm w-4 h-4 rounded-full bg-gray-300 text-gray-800' title={desc}>?</button></span>
                        {
                            alert && (
                                <div className={`absolute right-2 w-2 h-2 rounded-full bg-indigo-400 ${expanded ? "" : "top-2"
                                    }`} />
                            )
                        }

                        {
                            !expanded && <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100`}>
                                {text}
                            </div>
                        }
                    </button>
                    : <button onClick={() => handleOpen(link)} target='_blank' title={text} className={` 
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors
                ${active ?
                            "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
                            : "hover:bg-indigo-50 text-gray-600"
                        }
            `}>
                        {icon}
                        <span className={`overflow-hidden transition-all flex justify-between items-center ${expanded ? "w-52 ml-3" : "w-0"
                            }`}>{text} <button className='text-sm w-4 h-4 rounded-full bg-gray-300 text-gray-800' title={desc}>?</button></span>
                        {
                            alert && (
                                <div className={`absolute right-2 w-2 h-2 rounded-full bg-indigo-400 ${expanded ? "" : "top-2"
                                    }`} />
                            )
                        }

                        {
                            !expanded && <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100`}>
                                {text}
                            </div>
                        }
                    </button>
            }

        </li>
    </>);

}

export default function Sidebar() {
    const pathname = usePathname();
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.user);
    const handleLogout = async () => {
        const confirm = window.confirm("You want to logout.")
        if (confirm) {

            dispatch(logout());
        }
        console.log(confirm)
    }

    const isAllow = (permissionName) => {
        if (user?.isDJ) {
            if (user?.djPermissions.includes(permissionName)) {
                // if(permissionName === 'live'){
                //     if(user?.djTimeInDays){
                //         return checkInTimeRangeForDay(user?.djStartTime,user?.djEndTime,user);
                //     }else{
                //         const isTimeRange = checkInTimeRange(user?.djStartTime,user?.djEndTime,user?.djDate);
                //         return isTimeRange;
                //     }

                // }else{
                //     return true
                // }   
                return true
            } else {
                return false
            }
        } else {
            if (permissionName === 'playlists') {
                return false
            } else {
                return true
            }
        }
    }


    const navigationsItems = [
        {
            icon: <RxDashboard size={30} />,
            text: "Dashboard",
            alert: false,
            active: pathname == '/dashboard',
            link: '/dashboard',
            show: isAllow('dashboard'),
            desc: "overview of channel"
        },
        {
            icon: <BsCloudUpload size={30} />,
            text: `${user?.isDJ ? 'DJ' : 'Admin'} Uploads Song`,
            alert: false,
            active: pathname == '/dashboard/songs/upload',
            link: '/dashboard/songs/upload',
            show: isAllow('songs'),
            desc: "You are able to upload your songs"

        },
        {
            icon: <GiLoveSong size={30} />,
            text: `${user?.isDJ ? 'DJ' : 'Admin'} Uploaded Songs`,
            alert: false,
            active: pathname == '/dashboard/songs',
            link: '/dashboard/songs',
            show: true,
            desc: "All your uploaded songs will display here"
        },
        // {
        //     icon: <MdPlaylistAdd size={30}/>,
        //     text: `${user?.isDJ ? 'DJ' : 'Admin'} Create Playlist`,
        //     alert: false,
        //     active: pathname == '/dashboard/playlist-create',
        //     link: '/dashboard/playlist-create',
        //     show: true,
        //     desc: "You are able to add your songs in the form of playlist to arrange them well"

        // },
        // {
        //     icon: <BsMusicNoteList size={30}/>,
        //     text: `${user?.isDJ ? 'DJ' : 'Admin'}  Created Playlists`,
        //     alert: false,
        //     active: pathname == '/dashboard/playlist',
        //     link: '/dashboard/playlist',
        //     show: true,
        //     desc: "All your created playlists will display here"
        // },
        // {
        //     icon: <MdOutlineAdminPanelSettings size={30}/>,
        //     text: "Admin/Autodj Playlists",
        //     alert: false,
        //     active: pathname == '/dashboard/playlist-admin',
        //     link: '/dashboard/playlist-admin',
        //     show: isAllow('playlists'),
        //     desc: "You are able to copy admin playlists"

        // },


        {
            icon: <BsCalendarDate size={30} />,
            text: "Songs Schedules",
            alert: false,
            active: pathname == '/dashboard/shedules',
            link: '/dashboard/shedules',
            show: isAllow("schedules"),
            desc: "You are able to schedule your shows and your songs at your decided time"
        },
        {
            icon: <PiUsersThreeDuotone size={30} />,
            text: "Create DJs",
            alert: false,
            active: pathname == '/dashboard/team',
            link: '/dashboard/team',
            show: !user?.isDJ,
            desc: "Admin is able to add djs from here and to assign time and date to djs"
        },
        {
            icon: <BsMusicNoteList size={30} />,
            text: "My Form Status",
            alert: false,
            active: pathname == '/dashboard/my-form-status',
            link: '/dashboard/my-form-status',
            show: user?.isDJ === true,
            desc: "View your DJ application status"
        },
        {
            icon: <BsMailbox size={30} />,
            text: "Form Requests",
            alert: false,
            active: pathname == '/dashboard/form-requests',
            link: '/dashboard/form-requests',
            show: !user?.isDJ,
            desc: "Review and manage DJ application forms"
        },
        {
            icon: <HiOutlineAdjustmentsVertical size={30} />,
            text: "Manage Auto DJ",
            alert: false,
            active: pathname == '/dashboard/manage-auto-dj',
            link: '/dashboard/manage-auto-dj',
            show: isAllow("auto-dj"),
            desc: "You can manage auto dj songs"
        },
        // {
        //     icon: <LiaAdSolid size={30}/>,
        //     text: "Ads Jingles",
        //     alert: false,
        //     active: pathname == '/dashboard/ads',
        //     link: '/dashboard/ads',
        //     show: isAllow('ads'),
        //     desc: "You is able to add Ads Jingles"
        // },
        {
            icon: <GiMusicalScore size={30} />,
            text: "Manage Filter Effects",
            alert: false,
            active: pathname == '/dashboard/filter',
            link: '/dashboard/filter',
            show: true,
            desc: "Admin is able to add Filter effects"
        },
        // {
        //     icon: <BsMailbox size={30}/>,
        //     text: "Manage Live Playlist",
        //     alert: true,
        //     active: pathname == '/dashboard/manage-live',
        //     link: '/dashboard/manage-live',
        //     show: true,
        //     desc: "You can create a playlist before going to live which will be shown to during streaming"
        // },
        {
            icon: <CgEditFade size={30} />,
            text: "Testing",
            alert: false,
            active: pathname == '/dashboard/testing',
            link: '/dashboard/testing',
            show: isAllow("live"),
            desc: "You are able to test streaming"
        },
        {
            icon: <CiStreamOn size={30} />,
            text: "Start Streaming",
            alert: false,
            active: pathname == '/dashboard/go-live',
            link: '/dashboard/go-live',
            show: isAllow("live"),
            desc: "You are able to streaming"
        },
        {
            icon: <FiSettings size={30} />,
            text: "Welcome Tone",
            alert: false,
            active: pathname == '/dashboard/welcome-tone',
            link: '/dashboard/welcome-tone',
            show: true,
            desc: "You can create own welcome tone"
        },
        {
            icon: <FiSettings size={30} />,
            text: "Ending Tone",
            alert: false,
            active: pathname == '/dashboard/ending-tone',
            link: '/dashboard/ending-tone',
            show: true,
            desc: "You can create own ending tone"
        },


    ]
    return <>
        <SidebarBody>
            {
                navigationsItems.map((data) => data.show ? <SidebarItem {...data} /> : <HideLink {...data} />)
            }

            <SidebarItem icon={<MdOutlineLogout size={30} />} text={'Logout'} alert={false} link={''} active={false} onClick={handleLogout} />
        </SidebarBody>
    </>
}
const daysObject = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
};




function HideLink({ show, text, active, alert, icon }) {

    const { expanded } = useContext(SidebarContext);
    const { user } = useSelector(store => store.user);
    function handleClick() {
        if (user?.djTimeInDays) {
            toast.info(`You can start streaming only ${user?.djDays?.map((p, i) => `${i != 0 ? ' ,' : ' '} ${daysObject[p]}`)}`, {
                position: "top-center"
            });
        } else {
            toast.info(`You can start streaming only ${convertUTCToLocalTime(user?.djStartTime)} to ${convertUTCToLocalTime(user?.djEndTime)}`, {
                position: "top-center"
            });
        }

    }

    return (
        <>
            {
                text === "Start Streaming" &&
                <li onClick={handleClick}>
                    <button className={` 
                        relative flex items-center py-2 px-3 my-1
                        font-medium rounded-md
                        transition-colors
                        text-gray-300 cursor-[not-allowed]
                        ${active ?
                            "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
                            : "hover:bg-gray-50 text-gray-300"
                        }
                    `}>
                        {icon}
                        <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
                            }`}>{user.djTimeInDays ? `${user?.djDays?.map((p, i) => `${i != 0 ? ' ,' : ' '} ${daysObject[p]} ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`)}` : `${user.djDate} / ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`}</span>
                        {
                            alert && (
                                <div className={`absolute right-2 w-2 h-2 rounded-full bg-indigo-400 ${expanded ? "" : "top-2"
                                    }`} />
                            )
                        }

                        {
                            !expanded && <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100`}>
                                {text}
                            </div>
                        }
                    </button>
                </li>
            }
        </>
    )


}
