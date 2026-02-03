import React from 'react'
import { LiveProvider } from '@/context/LiveContextTest'

const layout = ({ children }) => {
  return (
    <>
        <LiveProvider isAdmin={true}>
            {children}
        </LiveProvider>
    </>
  )
}

export default layout