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

function checkInTimeRange(startTime,endTime,date){
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    // check date 
    const [userYear,userMonth,userDate] = date.split('-');
  

    const rangeStartHour = +startTime.split(':')[0];
    const rangeStartMinute = +startTime.split(':')[1];

    const rangeEndHour = +endTime.split(':')[0];
    const rangeEndMinute = +endTime.split(':')[1];

    const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

    console.log('range',timeInRange)

    if(isToday(userYear,userMonth,userDate) && timeInRange){
        return true;
    }else{
        return false;
    }
    // return timeInRange;
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
            const isRange = checkInTimeRange(user?.djStartTime,user?.djEndTime,user?.djDate);
            if(isRange && !ref.current){
                ref.current = setInterval(function(){
                    const currentHour = new Date().getHours();
                    const currentMinute = new Date().getMinutes();
                    const rangeEndHour = +user?.djEndTime?.split(':')[0];
                    const rangeEndMinute = +user?.djEndTime?.split(':')[1];

                    if(currentHour === rangeEndHour && currentMinute === rangeEndMinute-5){
                        toast.info('5 min left');
                    }

                    if(currentHour === rangeEndHour && currentMinute === rangeEndMinute-2){
                        toast.info('2 min left');
                    }


                    if(currentHour === rangeEndHour && currentMinute === rangeEndMinute){
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