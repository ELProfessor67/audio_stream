'use client'

import React,{useState,useEffect} from 'react'
import DashboardCard from '@/components/DashboardCard';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend,CategoryScale,LinearScale,PointElement,LineElement } from "chart.js";
import { Line } from 'react-chartjs-2';
import {FaRegClock} from 'react-icons/fa6'
import {useSelector} from 'react-redux';
import { MdContentCopy, MdCheck } from 'react-icons/md';


ChartJS.register(ArcElement, Tooltip, Legend,CategoryScale,LinearScale,PointElement,LineElement);



const page = () => {
  const [songs,setSongs] = useState(0);
  const [playlists,setPlaylists] = useState(0);
  const [ads,setAds] = useState(0);
  const [teams,setTeams] = useState(0);
  const [pSchedules,setPSchedules] = useState(0);
  const [cSchedules,setCSchedules] = useState(0);
  const [time,setTime] = useState('today');
  const [copied, setCopied] = useState(false);

  const {user} = useSelector(store => store.user);

  useEffect(() => {
    (async function(){
      try{
        const {data} = await axios.get('/api/v1/dashboard');
        const {data:ldata} = await axios.get(`/api/v1/listeners?time=${time}`);
        setTeams(data?.teams);
        setSongs(data?.songs);
        setPlaylists(data?.playlists);
        setAds(data?.ads);
        setPSchedules(data?.pschedules);
        setCSchedules(data?.cschedules);
      }catch(err){
        console.log(err.message)
      }
    })()
  },[])


  const data = {
    labels: ['Sunday','Monday','Tuesday','Wednesday','Thusday','Friday','Saturday'],
    datasets: [{
      label: 'Listeners',
      data: [100,3000,780008,78788,87,876,99878,87],
      borderColor: 'rgb(79 70 229)'
    }]
  }

  // Public schedule API URL — no parameters needed
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const scheduleApiUrl = origin ? `${origin}/api/v1/schedule-public` : '';

  const handleCopy = () => {
    if (!scheduleApiUrl) return;
    navigator.clipboard.writeText(scheduleApiUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="w-full py-5 px-4 reletive">
      <div className="flex justify-center items-center">
        <h1 className='main-heading my-10'>{user?.isDJ ? 'DJ Panel' : 'Admin Panel'}</h1>
      </div>

      <div className="w-full flex flex-wrap justify-center">
        <DashboardCard count={songs} name="songs"/>
        <DashboardCard count={playlists} name="playlists"/>
        <DashboardCard count={ads} name="ads"/>
        <DashboardCard count={teams} name="team"/>
        <DashboardCard count={pSchedules} name="pending schedules"/>
        <DashboardCard count={cSchedules} name="complete schedules"/>
      </div>

      <div className="mt-10">

        <div className="m-auto max-w-[50rem] p-4 shadow-md border border-gray-100 rounded-md">
          <div className="mb-5 flex justify-between items-center">
              <h2 className="text-xl text-black">Time Admitted</h2>
             
                <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                    <FaRegClock size={20} className='text-gray-400'/>
                    <select value={time} onChange={(e) => setTime(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your password' id='password' name='password'>
                      <option value="today">Today</option>
                      <option value="last-weel">Last Week</option>
                      <option value="last-month">Last Month</option>
                      <option value="last-year">Last Year</option>
                    </select>  
                </div>
          </div>
          <Line
          
            data={data}
            
          />
        </div>
        
      </div>

      {/* External Schedule API Card — admin only */}
      {!user?.isDJ && scheduleApiUrl && (
        <div className="m-auto max-w-[50rem] mt-10 p-5 shadow-md border border-indigo-100 rounded-md bg-indigo-50">
          <h2 className="text-lg font-semibold text-indigo-700 mb-1">📡 External Schedule API</h2>
          <p className="text-sm text-gray-500 mb-4">
            Use this URL on your external website to display the <strong>Daily Programs Schedule</strong> widget. No login required — it is public.
          </p>

          <div className="flex items-center gap-2">
            <input
              readOnly
              value={scheduleApiUrl}
              className="flex-1 text-xs font-mono bg-white border border-indigo-200 rounded-md px-3 py-2 outline-none text-gray-700 truncate"
              onClick={e => e.target.select()}
              id="schedule-api-url"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-indigo-500 hover:bg-indigo-700 text-white text-sm transition-all"
              title="Copy URL"
            >
              {copied ? <MdCheck size={18} /> : <MdContentCopy size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Example: fetch the URL and use the JSON to build your schedule widget.
          </p>

          <div className="mt-4 text-xs text-gray-500">
            <strong>Response shape:</strong>
            <pre className="bg-white rounded-md p-3 mt-1 overflow-x-auto border border-gray-100 text-gray-600">{`{
  "success": true,
  "station": { "name": "...", "website_url": "..." },
  "schedule": {
    "Monday": [
      {
        "djId": "...",
        "name": "DJ Name",
        "profilePicUrl": "https://...",
        "startTime": "06:00",
        "endTime": "08:00",
        "rawTime": "06:00|08:00",
        "timezone": "America/New_York"
      }
    ],
    "Tuesday": [ ... ]
  }
}`}</pre>
          </div>
        </div>
      )}
    </section>
  )
}

export default page