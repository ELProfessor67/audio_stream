import React from 'react'
import Link from 'next/link'
import {useState,useEffect} from 'react';
import { plansData } from '@/constants';

const CheckOut = ({SelectedPlan}) => {
    const [plan,setPlan] = useState({});
    useEffect(() => {
        const selectPlanData =  plansData.find(({name}) => name === SelectedPlan);
        setPlan(selectPlanData);
     },[SelectedPlan])
  return (
    <section className='section secction-checkout'>
        <div className='container m-auto h-screen flex justify-center items-center'>
            <div className='w-[32rem] max-w-[32rem]'>
                <div className='py-4 flex justify-center items-center'>
                    <h2 className='text-3xl'>Checkout</h2>
                </div>
                <div className='rounded shadow-md'>
                    <div className='py-5 px-3 bg-indigo-500 rounded-t-md'>
                        <h3 className='sub-heading text-white'>{plan.name} Pack - ${plan.price}</h3>
                    </div>
                    <div className='py-20 px-2 flex items-center flex-col gap-5'>
                        <p className='para'>{plan.description}</p>
                        <h2 className='text-4xl'>${plan.price} Only</h2>
                        <button type='button' className='py-3 w-[25rem] max-w-[25rem] hover:bg-indigo-800 transition-all px-3 rounded bg-indigo-500 text-white'>CheckOut Now</button>
                    </div>
                    <div className='py-5 px-3 bg-gray-600 rounded-b-md'>
                        <Link href={'/terms-conditions'}><h3 className='text-lg text-white'>Terms & Condition Apply</h3></Link>
                    </div>
                </div>
            </div>
        </div>
    </section>
  )
}

export default CheckOut