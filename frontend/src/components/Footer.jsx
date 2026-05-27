// import React from 'react'
// import { Link } from 'react-router-dom'
// import {FaFacebook, FaInstagram, FaTwitterSquare, FaPinterest } from 'react-icons/fa'

// const Footer = () => {
//   return (
//      <footer className='bg-gray-900 text-gray-200 py-10'>
//         <div className='max-w-7xl mx-auto px-4 md:flex md:justify-between'>
//             {/* info */}
//             <div className='mb-6 md:mb-0'>
//                 <Link to='/'><img src='/Ekart-logo.png' alt='' className='w-32'/></Link>
//                 <p className='mt-2 text-sm'>Powering your world with the best in Electronics.</p>
//                 <p className='mt-2 text-sm'>123 Electronics St, Style City, NY 10001.</p>
//                 <p className='text-sm'>Email: support@Zaptro.com</p>
//                 <p className='text-sm'>Phone: (123) 456-7890</p>
//             </div>
//             {/* customer service link */}
//             <div className='mb-6 md:mb-0'>
//                 <h3 className='text-xl font-semibold'>Customer Service</h3>
//                 <ul className='mt-2 text-sm space-y-2'>
//                     <li>Contact Us</li>
//                     <li>Shipping & Returns</li>
//                     <li>FAQs</li>
//                     <li>Order Tracking</li>
//                     <li>Size Guide</li>
//                 </ul>
//             </div>
//             {/* social media link */}
//             <div className='mb-6 md:mb-0'>
//                 <h3 className='text-xl font-semibold'>Follow Us</h3>
//                 <div className='flex space-x-4 mt-2'>
//                     <FaFacebook/>
//                     <FaInstagram/>
//                     <FaTwitterSquare/>
//                     <FaPinterest/>
//                 </div>
//             </div>
//             {/* newsletter subsciption */}
//             <div className='mb-6 md:mb-0'>
//                 <h3 className='text-xl font-semibold'>Stay in the Loop</h3>
//                 <p className='mt-2 text-sm'>Subscribe to get special offers, free giveaways, and more</p>
//                 <form action='' className='mt-4 flex'>
//                     <input 
//                     type='email'
//                     placeholder='Your email address'
//                     className='w-full p-2 rounded-l-md bg-white text-gray-400 focus:outline-none focus:ring-gray-500'/>
//                     <button type='submit' className='bg-pink-600 text-whitepx-4 rounded-r-md hover:bg-red-700'>Subscribes</button>
//                 </form>
//             </div>
//         </div>
//         {/* button section */}
//         <div className='mt-8 border-t border-gray-700 text-center text-sm'>
//             <p>&copy; {new Date().getFullYear()}<span className='text-pink-600'>Ekart</span>All rights reserved</p>
//         </div>
//      </footer>
//   )
// }

// export default Footer




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