import Image from 'next/image';
import {FaPlay,FaPause} from 'react-icons/fa';
import {MdDelete,MdEdit} from 'react-icons/md'

export default function SongCard({cover,audio,title,artist,setPlaySong,playSong,_id,deleteSong}){
	return(
		<div className="w-[22rem] min-h-[25rem] shadow-md border border-gray-100 rounded mx-4 my-5 relative p-3">
			{
				deleteSong && <div className="absolute top-3 right-3">
					<button onClick={() => deleteSong(_id)} className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 flex items-center" ><MdDelete size={20}/><span className='ml-1 text-gray-700'>delete</span></button>
				</div>
			}
			<div className="w-full h-[18rem] reletive">
				<Image src={cover} width={200} height={300} className="w-full h-full rounded-md"/>
			</div>

			<div className="details pt-3 flex justify-between items-center">
			 <div>
			 	<h2 className="sub-heading text-black">{title?.slice(0,40)}</h2>
			 	<p className="para"><span className="text-black">~ </span><span> {artist}</span></p>
			 </div>

			 <div className="w-[3rem] h-[3rem] bg-gray-100 grid place-items-center rounded-full cursor-pointer" onClick={() => playSong == audio ? setPlaySong('') : setPlaySong(audio)}>
			 	{playSong == audio ? <FaPause/> : <FaPlay/>}
			 </div>
			</div>
		</div>
	);
}