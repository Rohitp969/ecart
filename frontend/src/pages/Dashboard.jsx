import React from 'react'
import Sidebar from '../components/Sidebar'
import AddProduct from './admin/AddProduct'

const Dashboard = () => {
  return (
    <div className='flex'>
      <Sidebar/>
      <AddProduct/>
    </div>
  )
}

export default Dashboard
