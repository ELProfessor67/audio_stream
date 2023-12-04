"use client";
import React,{useRef} from 'react'
import { useEffect } from 'react'
import { useDispatch,useSelector } from 'react-redux'
import { loadme } from '@/redux/action/user'

function checkInTimeRange(startTime,endTime){
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    const rangeStartHour = +startTime.split(':')[0];
    const rangeStartMinute = +startTime.split(':')[1];

    const rangeEndHour = +endTime.split(':')[0];
    const rangeEndMinute = +endTime.split(':')[1];

    const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

    console.log('range',timeInRange)

    return timeInRange;
}

const UserProvider = ({children}) => {

    const dispatch = useDispatch();
    const ref = useRef();
    const {user} = useSelector(store => store.user);
    useEffect(() => {
        dispatch(loadme());
    },[]);

    useEffect(() => {
        if(user?.isDJ){
            const isRange = checkInTimeRange(user?.djStartTime,user?.djEndTime);
            if(isRange){
                ref.current = setInterval(function(){
                    const currentHour = new Date().getHours();
                    const currentMinute = new Date().getMinutes();
                    const rangeEndHour = +user?.djEndTime?.split(':')[0];
                    const rangeEndMinute = +user?.djEndTime?.split(':')[1];

                    if(currentHour === rangeEndHour && currentMinute === rangeEndMinute){
                        window.alert('live time is end');
                        window.location.pathname = '/dashboard';
                        clearInterval(ref.current);
                    }

                },50000)
            }
        }
    },[user]);
  return (
    <>
        {children}
    </>
  )
}

export default UserProvider