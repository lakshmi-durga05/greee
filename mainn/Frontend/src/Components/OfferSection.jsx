
import React from "react";
import { Search, Car, Bike, Truck, Clock, Gift, MapPin } from 'lucide-react';

export const OffersSection = () => (
  <section>
    <h2 className="text-lg font-semibold mb-4">Offers</h2>
    <div className="bg-blue-50 p-4 rounded-lg flex items-center">
      <Gift className="w-6 h-6 mr-3 text-blue-500" />
      <div>
        <h3 className="font-medium">15% off your next ride</h3>
        <p className="text-sm text-gray-600">Use code: RIDE15</p>
      </div>
    </div>
  </section>
);