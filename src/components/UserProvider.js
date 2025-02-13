"use client";
import React,{useRef} from 'react'
import { useEffect } from 'react'
import { useDispatch,useSelector } from 'react-redux'
import { loadme } from '@/redux/action/user'
import {toast} from 'react-toastify';

function isToday(year,month,date){
    const Currntdate = new Date();
    if(+year == Currntdate.getFullYear() && +month == Currntdate.getMonth()+1 && +date == Currntdate.getDate()){
        return true;
    }else{
        return false;
    }
}

function checkInTimeRange(startTime,endTime){
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();

    // check date 

  

    const rangeStartHour = +startTime?.split(':')[0];
    const rangeStartMinute = +startTime?.split(':')[1];

    const rangeEndHour = +endTime?.split(':')[0];
    const rangeEndMinute = +endTime?.split(':')[1];

    const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

    console.log('range',timeInRange)


    return timeInRange;
}

function checkIsStreamingDay(user){
    const [userYear,userMonth,userDate] = user?.djDate?.split('-');

    if(isToday(userYear,userMonth,userDate)){
        return true
    }
    const checkDay = user?.djDays?.includes((new Date().getDay()).toString())
    if(checkDay){
        return true
    }
    return false;
}

function addOneMinute(hours,minutes) {
    // Split the time string into hours and minutes
    // let [hours, minutes] = time.split(':').map(Number);
    
    // Increment the minutes
    minutes++;

    // If minutes exceed 59, adjust hours and minutes
    if (minutes > 59) {
        hours++;
        minutes = 0;
    }

    // If hours exceed 23, reset to 00
    if (hours > 23) {
        hours = 0;
    }

    // Format hours and minutes to have leading zeros if necessary
    hours = +hours;
    minutes = +minutes;

    // Return the result
    return [hours, minutes];
}

const UserProvider = ({children}) => {

    const dispatch = useDispatch();
    const ref = useRef();
    const {user} = useSelector(store => store.user);
    useEffect(() => {
        dispatch(loadme());
    },[]);

    useEffect(() => {
            if(user?.isDJ && checkIsStreamingDay(user)){

            const isRange = checkInTimeRange(user?.djStartTime,user?.djEndTime);
            console.info(isRange,'isRange');

            if(!isRange && !ref.current){
                ref.current = setInterval(function(){
                    let currentHour = new Date().getUTCHours();
                    let currentMinute = new Date().getUTCMinutes();
                    let hours = +user?.djStartTime?.split(':')[0];
                    let minutes = +user?.djStartTime?.split(':')[1];
                    if(currentHour === hours && currentMinute === minutes){
                        // toast.info('Your time has started now.');
                        // window.location.reload();
                    }

                },5000)
            }

            if(isRange && !ref.current){
                ref.current = setInterval(function(){
                    let currentHour = new Date().getUTCHours();
                    let currentMinute = new Date().getUTCMinutes();
                    let rangeEndHour = +user?.djEndTime?.split(':')[0];
                    let rangeEndMinute = +user?.djEndTime?.split(':')[1];

                    if(currentHour === rangeEndHour && currentMinute === rangeEndMinute-5){
                        toast.info('5 min left');
                    }

                    if(currentHour === rangeEndHour && currentMinute === rangeEndMinute-2){
                        toast.info('2 min left');
                    }

                    let [hours, minutes] = addOneMinute(rangeEndHour,rangeEndMinute);


                    if(currentHour === hours && currentMinute === minutes){
                        toast.info('live time is end');

                        if(window.location.pathname === '/dashboard/go-live'){
                            const asnwer = window.confirm('if you want to end live click ok');
                            if(asnwer){
                                window.location.pathname = '/dashboard';
                            }
                        }else{
                            window.location.pathname = '/dashboard';
                        }
                        
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