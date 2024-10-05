"use client"

import React,{useState,useEffect,useRef} from 'react'
import axios from 'axios';
import SongCard from '@/components/SongCard';
import SongPlayer from '@/components/SongPlayer';
import {MdPlaylistAdd} from 'react-icons/md';
import Dialog from '@/components/Dialog';
import Image from 'next/image';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';


function page({params}){
  const [songs,setSongs] = useState([]);
  const [playSong,setPlaySong] = useState('');

  const [seletdSongs,setSelectedSongs] = useState([]);
  const [allSongs,setAllSongs] = useState([]);
  const [open, setOpen] = useState(false);

  const songRef = useRef();
  const dispatch = useDispatch();

  // console.log(params.playlistId)


  useEffect(() => {
    if(playSong){
      songRef.current.src = playSong;
      songRef.current.play();

      console.log('play',playSong,songRef)
    }else{
      console.log('pause',playSong,songRef)
      songRef.current.pause();
    }
  },[playSong]);


  const handleSave = async () => {
    console.log(seletdSongs);
    try{
      const {data} = await axios.post(`/api/v1/playlist/${params.playlistId}`,{songs: seletdSongs});
      await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
      console.log(data)
      getPlayListSong();
      setOpen(false);
      }catch(error){
        await dispatch(showError(error.response.data.message));
        await dispatch(clearError()); 
    }
  }

  const handleCheckbox = (_id) => {
        setSelectedSongs(prev => {
            if(prev.includes(_id)){
                return prev.filter(id => _id != id);
            }else{
                return [...prev,_id]
            }
        })
    }

  async function getPlayListSong(){
        try{
          const {data} = await axios.get(`/api/v1/playlist/${params.playlistId}`);
          console.log(data)
          setSongs(data?.playlist?.songs);
          setSelectedSongs(prev => {
            const list = data?.playlist?.songs.map(data => data._id);
            return list;
          });


          const {data:d} = await axios.get('/api/v1/song');
          setAllSongs(d?.songs);
        }catch(err){
          console.log(err.response.data.message);
        }
      }

  useEffect(() => {
    getPlayListSong();
  },[]);
  return (
    <section className="w-full py-5 px-4 reletive">
      <div className="flex justify-between items-center px-4">
        <span></span>
        <h1 className='main-heading my-10'>My Songs</h1>
        <div className="text-gray-500 cursor-pointer" onClick={() => setOpen(true)}><MdPlaylistAdd size={30}/></div>
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

      <Dialog open={open} onClose={() => setOpen(false)} seletdSongs={seletdSongs} save={handleSave}>
          {
            allSongs && allSongs.map((data) => (
              <div className="flex justify-between items-center my-6">
                <div className="flex items-center gap-4">
                            <Image src={data.cover} width={200} height={200} alt="cover" className="h-[6rem] w-28 object-conver rounded"/> 
                            <h2 className="text-xl text-black">{data?.title}</h2>           
                        </div>

                        <div className="mr-10">
                            <input type="checkbox" className="p-4" checked={seletdSongs.includes(data._id)} onChange={() => handleCheckbox(data._id)}/>
                        </div>
              </div>
            ))
          }
        </Dialog>
    </section>
  )
}

export default page