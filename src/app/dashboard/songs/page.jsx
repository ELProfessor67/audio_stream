"use client"

import React,{useState,useEffect,useRef} from 'react'
import axios from 'axios';
import SongCard from '@/components/SongCard';
import SongPlayer from '@/components/SongPlayer';

function page(){
  const [songs,setSongs] = useState([]);
  const [playSong,setPlaySong] = useState('');
  const songRef = useRef();


  useEffect(() => {
    if(playSong){
      songRef.current.src = playSong;
      songRef.current.play();
      songRef.current.addEventListener('loadedmetadata',function(){
        console.log('duration',this.duration);           
      })

      console.log('play',playSong,songRef)
    }else{
      console.log('pause',playSong,songRef)
      songRef.current.pause();
    }
  },[playSong]);

  useEffect(() => {
    (
      async function(){
        try{
          const {data} = await axios.get('/api/v1/song');
          setSongs(data?.songs);
        }catch(err){
          console.log(err.response.data.message);
        }
      }
    )()
  },[]);
  return (
    <section className="w-full py-5 px-4 reletive">
      <div className="flex justify-center items-center">
        <h1 className='main-heading my-10'>My Songs</h1>
      </div>
      <div className="flex justify-start items-center flex-wrap">
        {
          songs.map((data) => (
            <>
              <SongCard {...data} setPlaySong={setPlaySong} playSong={playSong}/>
            </>
          ))
        }
      </div>
      <audio ref={songRef} className="hidden"></audio>
    </section>
  )
}

export default page