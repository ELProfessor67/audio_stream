import React from 'react'
import { LiveProvider } from '@/context/LiveContextTest'

const layout = ({ children }) => {
  return (
    <>
        <LiveProvider isAdmin={false}>
            {children}
        </LiveProvider>
    </>
  )
}

export default layout