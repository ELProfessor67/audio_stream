import ProtectProvider from '@/components/ProtectProvider'
import Sidebar from '@/components/Sidebar'
import React from 'react'

const layout = ({ children }) => {
  return (
    <>
        <ProtectProvider>
          <div className='flex'>
              <Sidebar/>
              <div className='flex-1 reletive h-screen overflow-y-auto pb-5'>
              {children}
              </div>
          </div>
        </ProtectProvider>
    </>
  )
}

export default layout