import Image from 'next/image';
import {FaPlay,FaPause} from 'react-icons/fa';

export default function SongCard({cover,audio,title,artist,setPlaySong,playSong,_id}){
	return(
		<div className="w-[22rem] min-h-[25rem] shadow-md border border-gray-100 rounded mx-4 my-5 reletive p-3">
			<div className="w-full h-[18rem] reletive">
				<Image src={cover} width={200} height={300} className="w-full h-full rounded-md"/>
			</div>

			<div className="details pt-3 flex justify-between items-center">
			 <div>
			 	<h2 className="sub-heading text-black">{title}</h2>
			 	<p className="para"><span className="text-black">~ </span><span> {artist}</span></p>
			 </div>

			 <div className="w-[3rem] h-[3rem] bg-gray-100 grid place-items-center rounded-full cursor-pointer" onClick={() => playSong == audio ? setPlaySong('') : setPlaySong(audio)}>
			 	{playSong == audio ? <FaPause/> : <FaPlay/>}
			 </div>
			</div>
		</div>
	);
}