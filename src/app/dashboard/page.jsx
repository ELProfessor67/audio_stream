'use client'

import React,{useState,useEffect} from 'react'
import DashboardCard from '@/components/DashboardCard';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend,CategoryScale,LinearScale,PointElement,LineElement } from "chart.js";
import { Line } from 'react-chartjs-2';
import {FaRegClock} from 'react-icons/fa6'
import {useSelector} from 'react-redux';


ChartJS.register(ArcElement, Tooltip, Legend,CategoryScale,LinearScale,PointElement,LineElement);



const page = () => {
  const [songs,setSongs] = useState(0);
  const [playlists,setPlaylists] = useState(0);
  const [ads,setAds] = useState(0);
  const [teams,setTeams] = useState(0);
  const [pSchedules,setPSchedules] = useState(0);
  const [cSchedules,setCSchedules] = useState(0);
  const [time,setTime] = useState('today');

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
    </section>
  )
}

export default page