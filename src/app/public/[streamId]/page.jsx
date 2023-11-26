"use client";
import {useSocketUser} from '@/hooks'
import {useRef} from 'react'

export default function page({params}){
	const audioRef = useRef();
	const {} = useSocketUser(params.streamId,audioRef);
	return(
		<div>
			<h2>{params.streamId}</h2>
			<audio ref={audioRef} controls></audio>
		</div>
	);
}