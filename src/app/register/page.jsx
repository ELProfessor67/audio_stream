"use client";
import CheckOut from '@/components/CheckOut';
import Plans from '@/components/Plans'
import Register from '@/components/Register';
import React, { useState } from 'react'


const Components = {
  register: Register,
  plans: Plans,
  checkout: CheckOut
}

const page = () => {
  const [SelectedPlan,setSelectedPlan] = useState('Standard');
  const [cname,setCname] = useState('plans');
  const Component = Components[cname]
 

  return (
    <Component setSelectedPlan={setSelectedPlan} SelectedPlan={SelectedPlan} setCname={setCname}/>
  )
}

export default page