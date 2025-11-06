import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from 'lucide-react'
import React from "react"

export default function UserPaymentPopup({fareDetails}) {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("online" || "cash" || null)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle payment submission logic here
    console.log("Payment submitted with method:", paymentMethod)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
      >
        Open Payment
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-2 top-2 p-2 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                <X className="h-4 w-4 text-gray-700" />
                <span className="sr-only">Close</span>
              </button>

              <h2 className="text-2xl font-bold mb-4">Payment Options</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="radio"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="mr-2"
                    id="online"
                  />
                  <label htmlFor="online" className="mr-4">Online Payment</label>

                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="mr-2"
                    id="cash"
                  />
                  <label htmlFor="cash">Cash Payment</label>
                </div>

                {paymentMethod === "online" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
                      <input
                        id="card-number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <input
                          id="expiry"
                          type="text"
                          placeholder="MM/YY"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">CVV</label>
                        <input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "cash" && (
                  <p className="text-sm text-gray-600 mb-4">
                    Please pay the amount in cash at the time of delivery or pickup.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                  disabled={!paymentMethod}
                >
                  Proceed to Payment
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
