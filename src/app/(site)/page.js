import Image from 'next/image'
import Link from 'next/link'
import {useLayoutEffect} from 'react';
import {redirect} from 'next/navigation';

export default function Home() {
  useLayoutEffect(() => {
      redirect('/login')
  },[]);
  return (<>
    <h1>Home Page</h1>
  </>)
}
