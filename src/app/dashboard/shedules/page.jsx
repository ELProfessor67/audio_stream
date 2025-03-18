"use client";
import { MdDelete, MdEdit } from 'react-icons/md'
import axios from 'axios'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch } from 'react-redux';



const days = {
	0: "Sunday",
	1: "Monday",
	2: "Tuesday",
	3: "Wednesday",
	4: "Thursday",
	5: "Friday",
	6: "Saturday"
};

export default function page() {

	const [schedules, setSchedules] = useState([]);
	const dispatch = useDispatch();
	console.log(schedules)

	async function getSchedules() {
		try {
			const { data } = await axios.get('/api/v1/schedule');
			setSchedules(data.schedules);
		} catch (err) {
			console.log(err.message)
		}
	}
	useEffect(() => {
		getSchedules()
	}, []);

	const deleteSchedule = async (id) => {
		try {
			const { data } = await axios.delete(`/api/v1/schedule?id=${id}`);
			console.log(data.message);
			await dispatch(showMessage(data.message));
			await dispatch(clearMessage());
			getSchedules();
		} catch (error) {
			await dispatch(showError(error.response.data.message));
			await dispatch(clearError());
		}
	}


	const toggleEnable = async (id,enabled) => {
		
		try {
			const { data } = await axios.put(`/api/v1/schedule/${id}`, { enabled });
			await dispatch(showMessage(data.message));
			await dispatch(clearMessage());
			getSchedules();
		} catch (error) {
			await dispatch(showError(error.response.data.message));
			await dispatch(clearError());
		}
	}

	return (
		<section className="w-full py-5 px-4 reletive">
			<div className="flex justify-center items-center">
				<h1 className='main-heading mt-10'>Schedules</h1>
			</div>
			<div className="flex justify-end items-center mb-5">
				<Link href="/dashboard/shedules/create" className="py-2 px-4 rounded-md bg-indigo-500 text-white">Add Song Schedule</Link>
			</div>
			<div className="reletive overflow-x-auto">
				<table className="w-full text-sm text-left">
					<thead className="text-sx text-white uppercase bg-indigo-500">
						<tr>
							<th scope='col' className="px-6 py-3">#</th>
							<th scope='col' className="px-6 py-3">Day</th>
							<th scope='col' className="px-6 py-3">Songs</th>
							<th scope='col' className="px-6 py-3">Enaled</th>
							<th scope='col' className="px-6 py-3 text-center">Action</th>
						</tr>
					</thead>

					<tbody>
						{schedules?.map((data, i) => <TableRow {...data} i={i + 1} deleteSchedule={deleteSchedule} toggleEnable={toggleEnable}/>)}
					</tbody>
				</table>
			</div>
		</section>
	)
}


const TableRow = ({ day, _id, songs, deleteSchedule, enabled, i,toggleEnable }) => (
	<tr className="bg-gray-50 font-midium border-b text-sm">
		<td className="px-6 py-4 whitespace-nowarp">{i}.</td>
		<td className="px-6 py-4 whitespace-nowarp">{days[day]}</td>
		<td className="px-6 py-4 whitespace-nowarp">
			{songs.length}
		</td>
		<td className="px-6 py-4 whitespace-nowarp" onClick={() => toggleEnable(_id,!enabled)}>

			<label className="relative inline-flex items-center cursor-pointer">
				<input type="checkbox" value="" className="sr-only peer" checked={enabled}/>
				<div className="group peer ring-0 bg-gradient-to-bl from-neutral-800 via-neutral-700 to-neutral-600 rounded-full outline-none duration-1000 after:duration-300 w-10 h-5 shadow-md peer-focus:outline-none after:content-[''] after:rounded-full after:absolute after:[background:#0D2B39] peer-checked:after:rotate-180 after:[background:conic-gradient(from_135deg,_#b2a9a9,_#b2a8a8,_#ffffff,_#d7dbd9_,_#ffffff,_#b2a8a8)] after:outline-none after:h-4 after:w-4 after:top-0.5 after:left-0.5 peer-checked:after:translate-x-5 peer-hover:after:scale-95 peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-900">
				</div>
			</label>

		</td>
		<td className="px-16 py-4 whitespace-nowarp flex gap-4 justify-center">
			<button onClick={() => deleteSchedule(_id)} className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 flex items-center"><MdDelete size={20} /> Delete</button>
			<Link href={`/dashboard/shedules/${_id}`} className="p-2 rounded-full text-green-400 hover:text-white hover:bg-green-400 flex items-center"><MdEdit size={20} /> Edit</Link>
		</td>



	</tr>
)