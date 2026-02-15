"use client";
import { MdDelete, MdEdit } from 'react-icons/md'
import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch } from 'react-redux';

export default function page() {

	const [teams, setTeams] = useState([]);
	// console.log(teams)
	const dispatch = useDispatch();

	async function getTeam() {
		try {
			const { data } = await axios.get('/api/v1/dj');
			setTeams(data.teams);
		} catch (err) {
			console.log(err.message)
		}
	}
	useEffect(() => {
		getTeam()
	}, []);

	const deleteTeam = async (id) => {
		try {
			const { data } = await axios.delete(`/api/v1/dj?id=${id}`);
			console.log(data.message);
			await dispatch(showMessage(data.message));
			await dispatch(clearMessage());
			getTeam();
		} catch (error) {
			await dispatch(showError(error.response.data.message));
			await dispatch(clearError());
			console.log(error.message)
		}
	}

	return (
		<section className="w-full py-5 px-4 reletive">
			<div className="flex justify-center items-center">
				<h1 className='main-heading mt-10'>My DJ</h1>
			</div>
			<div className="flex justify-end items-center mb-5">
				<Link href="/dashboard/team/create" className="py-2 px-4 rounded-md bg-indigo-500 text-white">Add DJ</Link>
			</div>
			<div className="reletive overflow-x-auto">
				<table className="w-full text-sm text-left">
					<thead className="text-sx text-white uppercase bg-indigo-500">
						<tr>
							<th scope='col' className="px-6 py-3">Name</th>
							<th scope='col' className="px-6 py-3">Timezone</th>
							<th scope='col' className="px-6 py-3">phone</th>
							<th scope='col' className="px-6 py-3">Email</th>
							<th scope='col' className="px-6 py-3">Permissions</th>
							<th scope='col' className="px-6 py-3">Time</th>
							<th scope='col' className="px-6 py-3 text-center">Action</th>
						</tr>
					</thead>

					<tbody>
						{teams?.map(data => <TableRow {...data} deleteTeam={deleteTeam} />)}
					</tbody>
				</table>
			</div>
		</section>
	)
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


function isToday(year, month, date) {
	const Currntdate = new Date();
	if (+year == Currntdate.getFullYear() && +month == Currntdate.getMonth() + 1 && +date == Currntdate.getDate()) {
		return true;
	} else {
		return false;
	}
}

function checkInTimeRange(startTime, endTime) {
	const currentHour = new Date().getUTCHours();
	const currentMinute = new Date().getUTCMinutes();

	const rangeStartHour = +startTime?.split(':')[0];
	const rangeStartMinute = +startTime?.split(':')[1];

	const rangeEndHour = +endTime?.split(':')[0];
	const rangeEndMinute = +endTime?.split(':')[1];

	const isOngoing = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) &&
		(currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

	let status;
	if (isOngoing) {
		status = 'Ongoing';
	} else if (currentHour > rangeEndHour || (currentHour === rangeEndHour && currentMinute > rangeEndMinute)) {
		status = 'Finished';
	} else {
		status = 'Remaining';
	}

	return status;
}

function checkIsStreamingDay(djDate, djDays) {
	const [userYear, userMonth, userDate] = djDate?.split('-');

	if (isToday(userYear, userMonth, userDate)) {
		return true
	}
	const checkDay = djDays?.includes((new Date().getDay()).toString())
	if (checkDay) {
		return true
	}
	return false;
}


function calculateRemainingTime(startTime) {
	const currentTime = new Date();
	const startTimeParts = startTime.split(':');
	const targetTime = new Date(currentTime);

	targetTime.setUTCHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0, 0); // Set the target time based on the provided start time

	// Calculate the difference in milliseconds
	const timeDifference = targetTime - currentTime;

	if (timeDifference <= 0) {
		return "No time remaining";
	}

	// Calculate days, hours, minutes, and seconds
	const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
	const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

	return `${String(Math.abs(days)).padStart(2, '0')}d, ${String(Math.abs(hours)).padStart(2, '0')}h, ${String(Math.abs(minutes)).padStart(2, '0')}m, ${String(Math.abs(seconds)).padStart(2, '0')}s`;
}


// Helper function to calculate the next available session based on djDays array
const calculateNextSession = (djDays, startTime) => {
	const now = new Date();
	const todayDay = now.getDay(); // Get current day index (0 - Sunday, 6 - Saturday)

	// Loop through djDays array to find the next available session day
	for (let i = 0; i < djDays.length; i++) {
		const nextDay = (todayDay + i) % 7; // Calculate the day of the next session
		if (djDays.includes(nextDay.toString())) {
			const nextSessionDate = new Date(now);
			nextSessionDate.setDate(now.getDate() + i); // Calculate next session date

			const [startHour, startMinute] = startTime.split(':').map((time) => +time);
			nextSessionDate.setHours(startHour, startMinute);

			const timeDifference = nextSessionDate - now;
			const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((timeDifference % (1000 * 60 * 1000 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

			return `${String(Math.abs(days)).padStart(2, '0')}d, ${String(Math.abs(hours)).padStart(2, '0')}h, ${String(Math.abs(minutes)).padStart(2, '0')}m, ${String(Math.abs(seconds)).padStart(2, '0')}s`
		}
	}

	return ''
};

const TableRow = ({ name, email, djPermissions, _id, djStartTime, djEndTime, deleteTeam, djDate, djTimeInDays, djDays, rawTime,timezone,phone }) => {
	const [currentStatus, setCurrectStatus] = useState('No Calculated');
	const timeRef = useRef();

	const calculateTime = () => {
		
		if (checkIsStreamingDay(djDate, djDays)) {
			const status = checkInTimeRange(djStartTime, djEndTime);
			if (status == "Ongoing") {
				setCurrectStatus(status);
			} else if (status == "Remaining") {
				const remainingTime = calculateRemainingTime(djStartTime);
				setCurrectStatus(remainingTime);
			} else {
				const remainingTime = calculateNextSession(djDays,djStartTime);
				setCurrectStatus(remainingTime);
			}
		} else {
			const remainingTime = calculateNextSession(djDays,djStartTime);
			setCurrectStatus(remainingTime);
		}
	}
	useEffect(() => {
		if(!timeRef.current){
			timeRef.current = setInterval(calculateTime,1000);
		}

		return () => {
			clearInterval(timeRef.current);
			timeRef.current = null;
		}
	}, []);

	return (
		<tr className="bg-gray-50 font-midium border-b text-sm">
			<td className="px-6 py-4 whitespace-nowarp">{name}</td>
			<td className="px-6 py-4 whitespace-nowarp">{timezone}</td>
			<td className="px-6 py-4 whitespace-nowarp">{phone}</td>
			<td className="px-6 py-4 whitespace-nowarp">{email}</td>
			<td className="px-6 py-4 whitespace-nowarp">
				{djPermissions?.map((p, i) => `${i != 0 ? ' ,' : ' '} ${p}`)}
			</td>
			{
				djTimeInDays ?
					<td className="px-6 py-4 whitespace-nowarp">
						{djDays?.map((p, i) => `${i != 0 ? ' ,' : ' '} ${daysObject[p]}`)} on {rawTime.split("|")[0]} - {rawTime.split("|")[1]}
						
					</td>
					: <td className="px-6 py-4 whitespace-nowarp">
						{djDate} / {rawTime.split("|")[0]} - {rawTime.split("|")[1]}
						
					</td>
			}

			{/* <td className="px-6 py-4 whitespace-nowarp">{djDate} / {djStartTime} - {djEndTime}</td> */}
			<td className="px-16 py-4 whitespace-nowarp flex gap-7 justify-center">
				<button onClick={() => deleteTeam(_id)} className="p-2 rounded-full flex items-center text-red-400 hover:text-white hover:bg-red-400"><MdDelete size={20} /><span className='ml-3 text-gray-700'>delete</span></button>
				<Link href={`/dashboard/team/${_id}`} className="p-2 rounded-full flex items-center text-green-400 hover:text-white hover:bg-green-400"><MdEdit size={20} /><span className='ml-3 text-gray-700'>edit</span></Link>
			</td>
		</tr>
	)
}








