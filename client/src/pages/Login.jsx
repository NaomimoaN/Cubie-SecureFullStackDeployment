// client/src/pages/Login.jsx

/**
 * Manages user login. It provides a form for email and password input,
 * processes authentication via `useAuth`, and handles redirection upon success or displays errors.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
// import { ReactComponent as LogoColor } from "../assets/react.svg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handles the form submission for user login.
   * Prevents default form behavior, clears previous errors, attempts login,
   * and navigates to the homepage on success or sets an error message on failure.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#FFFFFF] to-[#99C6FC]">
      {/* <LogoColor className="w-12 h-12" /> */}
      <svg
        width="152"
        height="50"
        viewBox="0 0 152 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-8"
      >
        <path
          d="M25.0841 0.672928L42.4031 10.6615C43.959 11.5588 44.9171 13.2169 44.9171 15.0114V22.1005C44.9171 23.8949 43.9584 25.5531 42.4031 26.4503L36.2576 29.994C34.7017 30.8913 33.7436 32.5494 33.7436 34.3439V41.433C33.7436 43.2274 32.7854 44.8856 31.2295 45.7828L25.0841 49.3271C23.5282 50.2243 21.6113 50.2243 20.056 49.3271L2.73695 39.3396C1.18103 38.4423 0.2229 36.7842 0.2229 34.9897V15.012C0.2229 13.2175 1.18103 11.5593 2.73695 10.6621L20.0554 0.672928C21.6113 -0.224309 23.5282 -0.224309 25.0835 0.672928H25.0841Z"
          fill="#3B82D9"
        />
        <path
          d="M21.6385 3.00923L7.53193 11.1453C6.78721 11.5749 6.78721 12.6492 7.53193 13.0788L21.6385 21.2149C22.2436 21.564 22.9889 21.564 23.5939 21.2149L37.7 13.0788C38.4447 12.6492 38.4447 11.5749 37.7 11.1453L23.5939 3.00923C22.9889 2.66005 22.2436 2.66005 21.6385 3.00923Z"
          fill="#A9D7FF"
        />
        <path
          d="M51.166 28.6075C51.166 23.4537 54.9114 19.6742 60.2227 19.6742C64.7855 19.6742 68.1219 22.4575 68.9392 26.4772H64.8536C64.1385 24.6565 62.4362 23.4883 60.2227 23.4883C57.2606 23.4883 55.2516 25.6185 55.2516 28.608C55.2516 31.5975 57.2606 33.7277 60.2227 33.7277C62.4357 33.7277 64.1385 32.5595 64.8536 30.7383H68.9392C68.1219 34.7585 64.7855 37.5413 60.2227 37.5413C54.9114 37.5413 51.166 33.7618 51.166 28.608V28.6075Z"
          fill="#393939"
        />
        <path
          d="M74.9982 28.9517V20.1213H79.0497V28.9517C79.0497 32.1815 80.752 33.7279 83.3057 33.7279C85.8594 33.7279 87.5617 32.182 87.5617 28.9517V20.1213H91.6133V28.9517C91.6133 34.6212 88.2763 37.5414 83.3052 37.5414C78.3341 37.5414 74.9971 34.6553 74.9971 28.9517H74.9982Z"
          fill="#393939"
        />
        <path
          d="M98.3558 28.4703V12.6994H102.407V22.5947C103.599 20.7047 105.608 19.6739 108.025 19.6739C112.111 19.6739 116.401 22.6288 116.401 28.4357C116.401 33.8303 112.656 37.541 107.31 37.541C101.965 37.541 98.3552 33.9677 98.3552 28.4703H98.3558ZM112.315 28.6078C112.315 25.6183 110.306 23.488 107.344 23.488C104.382 23.488 102.407 25.6183 102.407 28.6078C102.407 31.5972 104.382 33.7275 107.344 33.7275C110.306 33.7275 112.315 31.5972 112.315 28.6078Z"
          fill="#393939"
        />
        <path
          d="M122.394 15.2085C122.394 13.628 123.518 12.4598 125.084 12.4598C126.651 12.4598 127.774 13.628 127.774 15.2085C127.774 16.789 126.651 17.9231 125.084 17.9231C123.518 17.9231 122.394 16.789 122.394 15.2085ZM123.041 20.1215H127.093V37.0947H123.041V20.1215Z"
          fill="#393939"
        />
        <path
          d="M133.731 28.6075C133.731 23.4537 137.477 19.6742 142.788 19.6742C148.099 19.6742 151.777 23.4537 151.777 28.6075V30.0505H137.987C138.532 32.5243 140.405 33.83 142.788 33.83C144.592 33.83 145.92 33.3149 146.772 32.2148H151.096C149.836 35.4446 146.772 37.5407 142.788 37.5407C137.477 37.5407 133.731 33.7613 133.731 28.6075ZM147.487 26.7867C146.84 24.519 145.001 23.3855 142.788 23.3855C140.576 23.3855 138.737 24.5537 138.09 26.7867H147.488H147.487Z"
          fill="#393939"
        />
      </svg>

      <div className="w-[400px] h-[320px] max-w-screen-md p-8 bg-white rounded-3xl shadow-xl shadow-black/25">
        <h2 className="mb-4 text-[20px] font-bold text-center text-gray-800">
          Login
        </h2>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4 text-left">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            ></label>
            <input
              type="email"
              id="email"
              placeholder="Email *"
              className="text-[14px] text-black bg-white border p-3 w-[320px] h-[52px] rounded-lg mb-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 text-left">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-700"
            ></label>
            <input
              type="password"
              id="password"
              placeholder="Password *"
              className="text-[14px]  text-black bg-white border p-3 w-[320px] h-[52px] rounded-lg mb-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-[320px] h-[52px] py-2 text-sm font-semibold text-white bg-[#F06C00] hover:bg-[#E36600] focus:outline-none border-none rounded-full"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
