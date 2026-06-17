import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Letest Electronics at Best Price
            </h1>
            <p className="text-xl mb-6 text-blue-100">
              Discover cutting-edge technology with unbeatable deals on
              smartphone, laptops adn more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button  onClick={() => navigate("/products")} className="bg-white text-blue-600 hover:bg-gray-100 cursor-pointer">
                Shop Now
              </Button>
              <Button  onClick={() => navigate("/products")}
                variant="outline"
                className="border-white text-white hover:bg-white
                     hover:text-blue-600 bg-transparent cursor-pointer"
              >
                View Deals
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src="/Ekart1.png"
              alt="Electronics"
              className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
