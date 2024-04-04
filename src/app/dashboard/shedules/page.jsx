"use client";
import {MdDelete,MdEdit} from 'react-icons/md'
import axios from 'axios'
import {useState,useEffect} from 'react'
import Link from 'next/link'
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';

export default function page(){

	const [schedules,setSchedules] = useState([]);
	const dispatch = useDispatch();
	console.log(schedules)

	async function getSchedules(){
			try{
				const {data} = await axios.get('/api/v1/schedule');
				setSchedules(data.schedules);
			}catch(err){
				console.log(err.message)
			}
		}
	useEffect(() => {
		getSchedules()
	},[]);

	const deleteSchedule = async (id) => {
		try{
			const {data} = await axios.delete(`/api/v1/schedule?id=${id}`);
			console.log(data.message);
			await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
			getSchedules();
		}catch(error){
				await dispatch(showError(error.response.data.message));
        await dispatch(clearError());
		}
	}

	return(
		<section className="w-full py-5 px-4 reletive">
      <div className="flex justify-center items-center">
        <h1 className='main-heading mt-10'>Songs Schedules</h1>
      </div>
      <div className="flex justify-end items-center mb-5">
      	<Link href="/dashboard/shedules/create" className="py-2 px-4 rounded-md bg-indigo-500 text-white">Add Song Schedule</Link>
      </div>
      <div className="reletive overflow-x-auto">
      	<table className="w-full text-sm text-left">
	      	<thead className="text-sx text-white uppercase bg-indigo-500">
				<tr>
					<th scope='col' className="px-6 py-3">Date</th>
					<th scope='col' className="px-6 py-3">Time</th>
					<th scope='col' className="px-6 py-3">Ads Per Songs</th>
					<th scope='col' className="px-6 py-3">Songs</th>
					<th scope='col' className="px-6 py-3">Status</th>
					<th scope='col' className="px-6 py-3 text-center">Action</th>
				</tr>      		
	      	</thead>

	      	<tbody>
	      		{schedules?.map(data => <TableRow {...data} deleteSchedule={deleteSchedule}/>)}
	      	</tbody>
	      </table>
      </div>
    </section>
	)
}


const TableRow = ({date,time,songsPerAds,_id,songs,deleteSchedule,status}) => (
	<tr className="bg-gray-50 font-midium border-b text-sm">
	  <td className="px-6 py-4 whitespace-nowarp">{date}</td>
	  <td className="px-6 py-4 whitespace-nowarp">{time}</td>
	  <td className="px-6 py-4 whitespace-nowarp">{songsPerAds}</td>
	  <td className="px-6 py-4 whitespace-nowarp">
	      {songs.length}
	  </td>
	  <td className="px-6 py-4 whitespace-nowarp">{status}</td>
	  {
	  	status === 'pending'
	  	? <td className="px-16 py-4 whitespace-nowarp flex gap-4 justify-center">
			    <button onClick={() => deleteSchedule(_id)} className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400"><MdDelete size={20}/></button>
			    <Link href={`/dashboard/shedules/${_id}`} className="p-2 rounded-full text-green-400 hover:text-white hover:bg-green-400"><MdEdit size={20}/></Link>
			  </td>
			: <td className="px-16 py-4 whitespace-nowarp flex gap-7 justify-center">
			    <button className="p-2 rounded-full flex items-center text-red-400 " style={{opacity: 0.7,cursor: 'not-allowed'}}><MdDelete size={20}/><span className='ml-3 text-gray-700'>delete</span></button>
			    <button className="p-2 rounded-full flex items-center text-green-400 " style={{opacity: 0.7,cursor: 'not-allowed'}}><MdEdit size={20}/><span className='ml-3 text-gray-700'>edit</span></button>
			  </td>
	  }
	  
	</tr>
)