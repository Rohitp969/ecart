import React from 'react'
import { Link } from 'react-router-dom'
import {
  FaFacebook,
  FaInstagram,
  FaTwitterSquare,
  FaPinterest,
} from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className='bg-gray-900 text-gray-200 pt-10 pb-6'>
      
      {/* Main Footer */}
      <div className='max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>

        {/* Info Section */}
        <div>
          <Link to='/'>
            <img
              src='/Ekart-logo.png'
              alt='Ekart Logo'
              className='w-32'
            />
          </Link>

          <p className='mt-4 text-sm text-gray-300 leading-6'>
            Powering your world with the best in Electronics.
          </p>

          <p className='mt-3 text-sm text-gray-300'>
            123 Electronics St, Style City, NY 10001.
          </p>

          <p className='mt-2 text-sm text-gray-300'>
            Email: support@Ekart.com
          </p>

          <p className='mt-2 text-sm text-gray-300'>
            Phone: (123) 456-7890
          </p>
        </div>

        {/* Customer Service */}
        <div>
          <h3 className='text-xl font-semibold mb-4 text-white'>
            Customer Service
          </h3>

          <ul className='space-y-3 text-sm'>
            <li className='hover:text-pink-500 cursor-pointer transition'>
              Contact Us
            </li>

            <li className='hover:text-pink-500 cursor-pointer transition'>
              Shipping & Returns
            </li>

            <li className='hover:text-pink-500 cursor-pointer transition'>
              FAQs
            </li>

            <li className='hover:text-pink-500 cursor-pointer transition'>
              Order Tracking
            </li>

            <li className='hover:text-pink-500 cursor-pointer transition'>
              Size Guide
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className='text-xl font-semibold mb-4 text-white'>
            Follow Us
          </h3>

          <div className='flex items-center gap-4 text-2xl'>
            <FaFacebook className='hover:text-pink-500 cursor-pointer transition' />

            <FaInstagram className='hover:text-pink-500 cursor-pointer transition' />

            <FaTwitterSquare className='hover:text-pink-500 cursor-pointer transition' />

            <FaPinterest className='hover:text-pink-500 cursor-pointer transition' />
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className='text-xl font-semibold mb-4 text-white'>
            Stay in the Loop
          </h3>

          <p className='text-sm text-gray-300 leading-6'>
            Subscribe to get special offers, free giveaways, and more
          </p>

          <form className='mt-5 flex w-full max-w-md overflow-hidden rounded-md'>
            
            <input
              type='email'
              placeholder='Enter your email address'
              className='w-full  py-3 bg-white text-black outline-none'
            />

            <button
              type='submit'
              className='bg-pink-600 px-5 py-3 text-white font-medium hover:bg-red-700 transition'
            >
              Subscribe
            </button>

          </form>
        </div>
      </div>

      {/* Bottom Section */}
      <div className='mt-10 border-t border-gray-700 pt-5 text-center text-sm text-gray-400'>
        <p>
          &copy; {new Date().getFullYear()}
          <span className='text-pink-500 font-semibold'> Ekart </span>
          All rights reserved
        </p>
      </div>

    </footer>
  )
}

export default Footer;