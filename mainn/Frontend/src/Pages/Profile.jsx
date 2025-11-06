
import { useContext, useState } from "react";
import { X } from "lucide-react";
import { UserDataContext } from "../Context/UserContext";

export default function Profile() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
      const { user } = useContext(UserDataContext);
      console.log(user);
  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 sm:py-8">
            <div className="flex flex-col items-center sm:flex-row sm:items-start">
              <div className="w-24 h-24 bg-gray-300 rounded-full mb-4 sm:mb-0 sm:mr-6"></div>
              <div className="text-center sm:text-left flex-grow">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.fullname?.firstname}</h1>
                <p className="text-sm font-medium text-gray-500">{user?.email}</p>
                <button
                  className="mt-4 w-full sm:w-auto bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                  onClick={() => setIsPopupOpen(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <button className="w-full sm:w-auto border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-100 transition duration-300">
              Logout
            </button>
          </div>
        </div>
      </div>

      {isPopupOpen && <EditProfilePopup onClose={() => setIsPopupOpen(false)} />}
    </div>
  );
}

function EditProfilePopup({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              defaultValue="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              defaultValue="john.doe@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              defaultValue="+1 (555) 123-4567"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}