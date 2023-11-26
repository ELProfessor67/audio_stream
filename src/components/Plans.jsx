"use client";
import React, { useState } from 'react'
import PlanCard from '@/components/PlanCard'
import {plansData} from '@/constants'


const Plans = ({setSelectedPlan,setCname}) => {
    
  return (
    <section className='section section-plans'>
        <div className='container m-auto'>
            <div className='flex justify-center items-center mb-8'>
                <h1 className='main-heading'>Select Plans</h1>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 place-items-center'>
            {
                plansData.map((data) => <PlanCard {...data} setSelectedPlan={setSelectedPlan} setCname={setCname}/>)
            }
            </div>
        </div>
    </section>
  )
}

export default Plans