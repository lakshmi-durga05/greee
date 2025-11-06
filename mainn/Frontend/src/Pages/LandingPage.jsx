import React from 'react';
import { Link } from 'react-router-dom';
import { Testimonials, ScrollAnimation } from '../Components';

const LandingPage = () => (
  <div className="bg-black text-white min-h-screen">
    {/* Header Section */}
    <div className="h-[550px] grid place-content-center text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold">Welcome to Stream Pulse</h1>
      <p className="text-xl md:text-2xl mt-4">Fast, reliable and safe rides at your fingertips.</p>
      <div className="flex justify-center py-10">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
          alt="Stream Pulse hero"
          className="h-40 md:h-60 rounded"
        />
      </div>
    </div>

    {/* Testimonials Section */}
    <div className="bg-gray-800 py-16 px-4">
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">What Our Customers Say</h2>
      <Testimonials />
    </div>

    {/* Scrollable Features Section */}
    <div className="py-16 px-4">
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">Why Choose Us?</h2>
      <div>
        <ScrollAnimation
          direction="left"
          viewport={{ amount: 0.5, margin: '0px 0px 0px 0px' }}
          className="text-2xl md:text-3xl text-left py-10 md:py-20"
        >
          <p>Fast and Safe Rides</p>
        </ScrollAnimation>
        <ScrollAnimation
          direction="right"
          viewport={{ amount: 0.5, margin: '0px 0px 0px 0px' }}
          className="text-2xl md:text-3xl text-right py-10 md:py-20"
        >
          <p>Highly Rated Drivers</p>
        </ScrollAnimation>
        <ScrollAnimation
          viewport={{ amount: 0.5, margin: '0px 0px 0px 0px' }}
          className="text-2xl md:text-3xl text-center py-10 md:py-20"
        >
          <p>Ride Anytime, Anywhere</p>
        </ScrollAnimation>
      </div>
    </div>

    {/* Call to Action Section */}
    <div className="py-10 text-center bg-gray-900 px-4">
      <h2 className="text-3xl md:text-4xl font-semibold mb-6">Ready to Ride?</h2>
      <Link to="/login">
        <button className="px-6 md:px-8 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition duration-300">
          Continue
        </button>
      </Link>
    </div>
  </div>
);

export default LandingPage;
