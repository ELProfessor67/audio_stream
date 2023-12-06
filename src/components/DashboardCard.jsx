import CountUp from 'react-countup';

export default function DashboardCard({count,name}){
	return(
		<div className="w-[18rem] shadow-md border border-gray-100 rounded-md m-2">
		<div className="p-2 text-xl text-white bg-indigo-600 rounded-t-md">
			<h2 className="text-xl text-white text-center uppercase">{name}</h2>
		</div>
			<h2 className="text-7xl text-center text-gray-700 my-6">{count == 0 ? count : <CountUp end={count}/>}</h2>
		</div>
	)
}