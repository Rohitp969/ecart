import React from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className='flex'>
      <Sidebar/>

       {/* Right side content */}
      <div className="flex-1 p-5"> 
        <Outlet />
       </div>
    </div>
  )
}

export default Dashboard