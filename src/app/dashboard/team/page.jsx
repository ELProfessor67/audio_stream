"use client";
import {MdDelete,MdEdit} from 'react-icons/md'
import axios from 'axios'
import {useState,useEffect} from 'react'
import Link from 'next/link'

export default function page(){

	const [teams,setTeams] = useState([]);
	console.log(teams)

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
			getTeam();
		}catch(err){
				console.log(err.message)
		}
	}

	return(
		<section className="w-full py-5 px-4 reletive">
      <div className="flex justify-center items-center">
        <h1 className='main-heading mt-10'>My Songs</h1>
      </div>
      <div className="flex justify-end items-center mb-5">
      	<Link href="/dashboard/team/create" className="py-2 px-4 rounded-md bg-indigo-500 text-white">Add Team</Link>
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


const TableRow = ({name,email,djPermissions,_id,djStartTime,djEndTime,deleteTeam}) => (
	<tr className="bg-gray-50 font-midium border-b text-sm">
	  <td className="px-6 py-4 whitespace-nowarp">{name}</td>
	  <td className="px-6 py-4 whitespace-nowarp">{email}</td>
	  <td className="px-6 py-4 whitespace-nowarp">{djStartTime} - {djEndTime}</td>
	  <td className="px-6 py-4 whitespace-nowarp">
	      {djPermissions?.map((p,i) => `${i != 0 ? ' ,' : ' '} ${p}`)}
	  </td>
	  <td className="px-16 py-4 whitespace-nowarp flex gap-4 justify-center">
	    <button onClick={() => deleteTeam(_id)} className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400"><MdDelete size={20}/></button>
	    <Link href={`/dashboard/team/${_id}`} className="p-2 rounded-full text-green-400 hover:text-white hover:bg-green-400"><MdEdit size={20}/></Link>
	  </td>
	</tr>
)