import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";

function StudentQuizResult({ user }) {

  // To get the score from parent component;
  const searchParams = new URLSearchParams(window.location.search);
  const score = searchParams.get("score") || 0;

  const { subjectId, week } = useParams(); //get subjectId and week from the URL
  // const questionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // const options = ["A", "B", "C", "D"]; // Define the options for the quiz
  // const randomScore = Math.floor(Math.random() * 100); // Simulate a random score for the quiz
  // The subject of questions and answers:
  // const questionsAnswers = [[Question1, Answer1], [Question2, Answer2], [Question3, Answer3], [Question4, Answer4], [Question5, Answer5], [Question6, Answer6], [Question7, Answer7], [Question8, Answer8], [Question9, Answer9], [Question10, Answer10]];
  const navigate = useNavigate();

  return (
    <div>

      {/* The Description part */}
      <div className="w-full mb-10 text-center">
        <h2 className="text-2xl font-bold my-10">Congratulations!</h2>
        <div className="flex justify-center">
          <img src="../../../../../public/AI-question/practice-trophy.png" alt="A trophy. You did a great job." />
        </div>
        <p className="my-10 text-2xl font-bold">You scored {score}%</p>

        {/* Buttons */}
        <div className="flex justify-center gap-20 mt-10">
          {/* Discarded design: Retry Week Button */}
          {/* <button
            onClick={() => navigate(`/student/subject/${subjectId}/quizzes/${week}`)} // Navigate to the same week
            className="bg-[#E2E2E2] hover:bg-gray-400 text-#393939 font-bold py-2 px-4 rounded-3xl w-40 h-12"
          >
            Retry Week
          </button> */}

          {/* Change Week Button */}
          <button
            onClick={() => navigate(`/student/subject/${subjectId}/quizzes`)} // Navigate to the subject's week selection page
            className="bg-[#F06C00] hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-3xl w-40 h-12"
          >
            Change Week
          </button>
        </div>
      </ div>

    </div>
  )
}

export default StudentQuizResult;


