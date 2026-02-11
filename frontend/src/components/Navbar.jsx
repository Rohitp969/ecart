import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
     <header className='bg-pink-50 fixed w-full z-20 border-b border-pink-200'>
      <div className='max-w-7xl mx-auto flex justify-between items-center py-3'>
      {/* logo section */}
      <div>
        <img src='' alt='' className='w-[100px]'/>
      </div>
      {/* nav section */}
      <nav className='flex gap-10 justify-between items-center'>
        <ul className='flex gap-7 items-center text-xl font-semibold'>
        <Link to={'/'}><li>Home</li></Link>
        <Link to={'/product'}><li>Products</li></Link>
        {
          user && <Link to={'/profile'}><li>Hello User</li></Link>
        }
        </ul>
        <Link to={'/cart'} className='relative'></Link>
      </nav>
      </div>
     </header>
  )
}

export default Navbar
