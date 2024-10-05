"use client";
import {MdDelete,MdEdit} from 'react-icons/md'
import axios from 'axios'
import {useState,useEffect} from 'react'
import Link from 'next/link'
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';

export default function page(){

	const [teams,setTeams] = useState([]);
	// console.log(teams)
	const dispatch = useDispatch();

	async function getTeam(){
			try{
				const {data} = await axios.get('/api/v1/dj');
				setTeams(data.teams);
			}catch(err){
				console.log(err.message)
			}
		}
	useEffect(() => {
		getTeam()
	},[]);

	const deleteTeam = async (id) => {
		try{
			const {data} = await axios.delete(`/api/v1/dj?id=${id}`);
			console.log(data.message);
			await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
      getTeam();
		}catch(error){
				await dispatch(showError(error.response.data.message));
        await dispatch(clearError());
				console.log(error.message)
		}
	}

	return(
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
					<th scope='col' className="px-6 py-3">Email</th>
					<th scope='col' className="px-6 py-3">Permissions</th>
					<th scope='col' className="px-6 py-3">Time</th>
					<th scope='col' className="px-6 py-3 text-center">Action</th>
				</tr>      		
	      	</thead>

	      	<tbody>
	      		{teams?.map(data => <TableRow {...data} deleteTeam={deleteTeam}/>)}
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


const TableRow = ({name,email,djPermissions,_id,djStartTime,djEndTime,deleteTeam,djDate,djTimeInDays,djDays,rawTime}) => (
	<tr className="bg-gray-50 font-midium border-b text-sm">
	  <td className="px-6 py-4 whitespace-nowarp">{name}</td>
	  <td className="px-6 py-4 whitespace-nowarp">{email}</td>
	  <td className="px-6 py-4 whitespace-nowarp">
	      {djPermissions?.map((p,i) => `${i != 0 ? ' ,' : ' '} ${p}`)}
	  </td>
	  {
		djTimeInDays ?
		<td className="px-6 py-4 whitespace-nowarp">{djDays?.map((p,i) => `${i != 0 ? ' ,' : ' '} ${daysObject[p]}`)} on {rawTime.split("|")[0]} - {rawTime.split("|")[1]}</td>
		:<td className="px-6 py-4 whitespace-nowarp">{djDate} / {rawTime.split("|")[0]} - {rawTime.split("|")[1]}</td>
	  }
	  {/* <td className="px-6 py-4 whitespace-nowarp">{djDate} / {djStartTime} - {djEndTime}</td> */}
	  <td className="px-16 py-4 whitespace-nowarp flex gap-7 justify-center">
	    <button onClick={() => deleteTeam(_id)} className="p-2 rounded-full flex items-center text-red-400 hover:text-white hover:bg-red-400"><MdDelete size={20}/><span className='ml-3 text-gray-700'>delete</span></button>
	    <Link href={`/dashboard/team/${_id}`} className="p-2 rounded-full flex items-center text-green-400 hover:text-white hover:bg-green-400"><MdEdit size={20}/><span className='ml-3 text-gray-700'>edit</span></Link>
	  </td>
	</tr>
)