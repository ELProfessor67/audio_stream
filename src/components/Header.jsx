"use client";
import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation';

const Header = () => {
  // const pathname = usePathname();
  // useEffect(() => {
  //   if(pathname.includes('/dashboard') || pathname.includes('/public')){
  //     window.document.getElementById('header').style.display = 'none';
  //   }else{
  //     window.document.getElementById('header').style.display = 'flex';
  //   }
  // },[]);
  return (
    // <div className='flex justify-center items-center gap-8 py-4 px-2 shadow-md' id='header'>
    //   <Link href={'/login'} className='py-2 px-4 transition-all hover:bg-indigo-100 text-indigo-800  rounded-md text-xl'>Login</Link>
    //   <Link href={'/register'} className='py-2 px-4 transition-all hover:bg-indigo-100 text-indigo-800  rounded-md text-xl'>Register</Link>
    // </div>
    <></>
  )
}

export default Header