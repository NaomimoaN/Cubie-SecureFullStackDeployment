// client/src/components/student/quiz/StudentSubjectQuizzes.jsx
// If you want to modify the top bar, go to // client/src/components/content/StudentSubjectDetail.jsx
// This is temporary component.
import React, { useEffect, useState } from "react";
import { Link, Routes, Route, useLocation, Outlet, useNavigate, useParams } from "react-router-dom";

function StudentSubjectQuizzes({ user }) {
  const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // console.log(user);
  const { subjectId, week } = useParams(); // Retrieve subjectId from the URL
  // To control the hover effect in react, we need to use useState
  const [imageSrcs, setImageSrcs] = useState(
    weekNumbers.map((number) => `/AI-week-selection/${number}-default.png`)
  );
  const navigate = useNavigate();


  // console.log("Subject ID:", subjectId);
  // console.log("Week:", week); //week is undefined before you select a week

  // Handle the hovering effect (Discarded)
  // const handleMouseEnter = (index, number) => {
  //   const newImageSrcs = [...imageSrcs];
  //   newImageSrcs[index] = `../../../../public/AI-week-selection/${number}-active.png`;
  //   setImageSrcs(newImageSrcs);
  // };

  // const handleMouseLeave = (index, number) => {
  //   const newImageSrcs = [...imageSrcs];
  //   newImageSrcs[index] = `../../../../public/AI-week-selection/${number}-default.png`;
  //   setImageSrcs(newImageSrcs);
  // };

  const handleClick = (index, number) => {
    // Change the image to active
    // Create an new array to avoid mutating the state directly
    const newImageSrcs = [...imageSrcs];
    newImageSrcs[index] = `/AI-week-selection/${number}-active.png`;
    setImageSrcs(newImageSrcs);

    // Delay navigation by 500ms
    setTimeout(() => {
      navigate(`week${number}`);
    }, 250); // Adjust the delay time as needed

    setTimeout(() => {
      newImageSrcs[index] = `/AI-week-selection/${number}-default.png`;
      setImageSrcs(newImageSrcs);
    }, 260);
  };


  // If the `week` parameter exists, render only the child route (StudentQuiz.jsx)
  if (week) {
    return <Outlet />;
  }

  return (
    <div className="w-full">
      <div className="mb-10 text-center text-[2rem]">
        <h2>Choose a week to begin the exercise</h2>
      </div>

      <div className="flex justify-center mb-10">
        <div className="w-[50%] grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-10">
          {/* Always remember, index is also an parameter in the map function */}
          {weekNumbers.map((number, index) => (
            <div
              key={number}
              className=" overflow-hidden transition-shadow"
              // Absolute path starts with / while Relative Path no leading slash
              onClick={() => handleClick(index, number)}
            // onMouseEnter={() => handleMouseEnter(index, number)}
            // onMouseLeave={() => handleMouseLeave(index, number)}
            >
              <img
                src={imageSrcs[index]}
                alt={`Week ${number}`}
                className="w-full h-auto hover-img"
              />
            </div>
          ))}
        </div>
      </div>

    </div >
  )
}

export default StudentSubjectQuizzes;
