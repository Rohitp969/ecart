import React from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className='flex flex-col md:flex-row'>
      <Sidebar/>

       {/* Right side content */}
      <div className="flex-1 p-5 overflow-x-hidden">
        <Outlet />
       </div>
    </div>
  )
}

export default Dashboard