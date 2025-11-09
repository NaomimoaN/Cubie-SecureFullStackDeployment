import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  useParams,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { getAIQuestions, getWeekContent } from "../../../services/AIPractice";
import useAuth from "../../../hooks/useAuth";
import ReactCardFlip from "react-card-flip";

function StudentQuiz({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId, week } = useParams();
  const { theUser, loading: authLoading } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [AIQuestionCollector, setAIQuestionCollector] = useState([
    {
      question: "Loading Question...",
      options: [
        "Loading option1",
        "Loading option2",
        "Loading option3",
        "Loading option4",
      ],
      correctAnswer: "Loading option2",
      explanation: "Loading explanation1",
    },
    {
      question: "Loading Question...",
      options: [
        "Loading option1",
        "Loading option2",
        "Loading option3",
        "Loading option4",
      ],
      correctAnswer: "Loading option2",
      explanation: "Loading explanation1",
    },
  ]);
  const questionNumbers = [1, 2, 3, 4, 5];
  const [weekContentDescription, setWeekContentDescription] =
    useState(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasFetchedAIQuestions, setHasFetchedAIQuestions] = useState(false);

  // Single state for tracking flip states and counts for all questions
  const [questionStates, setQuestionStates] = useState(
    questionNumbers.map(() => ({
      isFlipped: Array(4).fill(false),
      flipCount: 0,
    }))
  );

  const currentQuestionState = questionStates[currentQuestion - 1];
  const options = [
    AIQuestionCollector[currentQuestion - 1].options[0],
    AIQuestionCollector[currentQuestion - 1].options[1],
    AIQuestionCollector[currentQuestion - 1].options[2],
    AIQuestionCollector[currentQuestion - 1].options[3],
  ];
  const answers = [
    `Correct! ${AIQuestionCollector[currentQuestion - 1].explanation}`,
    AIQuestionCollector[currentQuestion - 1].explanation,
  ];
  const correctAnswers = [
    AIQuestionCollector[currentQuestion - 1].correctAnswer,
  ];

  // Reset states on mount to ensure fresh quiz
  // useEffect(() => {
  //   setCurrentQuestion(1);
  //   setScore(0);
  //   setQuestionStates(
  //     questionNumbers.map(() => ({
  //       isFlipped: Array(4).fill(false),
  //       flipCount: 0,
  //     }))
  //   );
  // }, [subjectId, week]); // Reset when subjectId or week changes

  const handleFlip = (index) => {
    if (currentQuestionState.flipCount < 2) {
      const updatedIsFlipped = [...currentQuestionState.isFlipped];
      updatedIsFlipped[index] = !updatedIsFlipped[index];

      const updatedQuestionStates = [...questionStates];
      updatedQuestionStates[currentQuestion - 1] = {
        ...currentQuestionState,
        isFlipped: updatedIsFlipped,
        flipCount: currentQuestionState.flipCount + 1,
      };

      setQuestionStates(updatedQuestionStates);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questionNumbers.length) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      navigate(
        `/student/subject/${subjectId}/quizzes/${week}/result?score=${
          score * 20
        }`
      );
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleAnswer = (index) => {
    if (
      options[index] === AIQuestionCollector[currentQuestion - 1].correctAnswer
    ) {
      setScore((prevScore) => prevScore + 1);
      console.log("Correct! Score updated.");
    } else {
      console.log("Incorrect!");
    }
    console.log("Current score:", score);
  };

  const extractContentBetweenMarkers = (fullString, startMarker, endMarker) => {
    if (typeof fullString !== "string") {
      console.error(
        "extractContentBetweenMarkers: fullString is not a string.",
        fullString
      );
      return "fullString is Not a string";
    }
    const escapedStartMarker = startMarker.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const escapedEndMarker = endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedStartMarker}(.*?)${escapedEndMarker}`);
    const match = fullString.match(regex);
    return match && match[1] ? match[1] : "No string for you!!";
  };

  const fetchWeekContent = async () => {
    try {
      setIsFetching(true);
      const weekContentData = await getWeekContent(week, subjectId);
      setWeekContentDescription(weekContentData.description || undefined);
      console.log("WeekContentData:", weekContentData.description);
    } catch (err) {
      console.error("Failed to fetch Week Contents:", err);
      setError("Failed to load Week Content. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchAIQuestions = async (
    subjectName,
    studentGrade,
    weekContentDescription
  ) => {
    try {
      const data = await getAIQuestions(
        subjectName,
        studentGrade,
        weekContentDescription
      );
      const temp = [];
      for (let i = 0; i < questionNumbers.length; i++) {
        const testQuestion1 = extractContentBetweenMarkers(
          data,
          `q${i}1s"`,
          `"q${i}1e`
        );
        const testOption1 = extractContentBetweenMarkers(
          data,
          `o${i}1s"`,
          `"o${i}1e`
        );
        const testOption2 = extractContentBetweenMarkers(
          data,
          `o${i}2s"`,
          `"o${i}2e`
        );
        const testOption3 = extractContentBetweenMarkers(
          data,
          `o${i}3s"`,
          `"o${i}3e`
        );
        const testOption4 = extractContentBetweenMarkers(
          data,
          `o${i}4s"`,
          `"o${i}4e`
        );
        const testAnswer1 = extractContentBetweenMarkers(
          data,
          `c${i}1s"`,
          `"c${i}1e`
        );
        const testExplain1 = extractContentBetweenMarkers(
          data,
          `e${i}1s"`,
          `"e${i}1e`
        );
        const subjectContainer = {
          question: testQuestion1,
          options: [testOption1, testOption2, testOption3, testOption4],
          correctAnswer: testAnswer1,
          explanation: testExplain1,
        };
        temp.push(subjectContainer);
      }
      setAIQuestionCollector(temp);
      console.log("AIQuestionCollector updated:", temp);
    } catch (err) {
      console.error("Failed to fetch AI Questions:", err);
      setError("Failed to load your AI practice questions. Please try again.");
      // alert("Too many requests or AI server overloaded. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekContent();
  }, []);

  useEffect(() => {
    if (
      !hasFetchedAIQuestions &&
      !isFetching &&
      weekContentDescription !== undefined
    ) {
      const subjectName = user.registeredSubjects.find(
        (subject) => subject._id === subjectId
      )?.name;
      const studentGrade = user.profile.grade;
      fetchAIQuestions(subjectName, studentGrade, weekContentDescription);
      setHasFetchedAIQuestions(true);
    }
  }, [isFetching, weekContentDescription, user, subjectId]);

  useEffect(() => {
    console.log("AIQuestionCollector updated:", AIQuestionCollector);
  }, [AIQuestionCollector]);

  if (location.pathname.includes("result")) {
    return <Outlet />;
  }

  const buttonColors = ["#FFA237", "#A9D7FF", "#E8DA53", "#EEACD9"];

  return (
    <div>
      <div className="text-2xl font-bold text-center mx-20 mb-10">
        <h2>
          Question {currentQuestion}/{questionNumbers.length}
        </h2>
      </div>
      <div>
        <p className="mx-10 mb-10 text-[1.5rem] text-center leading-[1.5]">
          {AIQuestionCollector.length > 0
            ? AIQuestionCollector[currentQuestion - 1].question
            : "Loading..."}
        </p>
      </div>
      <div className="flex gap-4 mb-20 justify-center">
        {options.map((option, index) => (
          <ReactCardFlip
            key={index}
            isFlipped={currentQuestionState.isFlipped[index]}
            flipDirection="horizontal"
          >
            <button
              onClick={() => {
                handleFlip(index);
                handleAnswer(index);
              }}
              disabled={currentQuestionState.flipCount >= 2}
              className={`size-[300px] bg-blue-500 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition duration-300 ${
                currentQuestionState.flipCount >= 2
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              style={{
                backgroundColor: buttonColors[index],
                fontSize:
                  option.length <= 35
                    ? "2rem"
                    : option.length <= 50
                    ? "1.75rem"
                    : "1.5rem",
              }}
            >
              {option}
            </button>

            <button
              className={`size-[300px] bg-white text-black font-semibold py-4 px-6 rounded-lg shadow-md transition duration-300`}
              style={{
                border: `1px solid ${buttonColors[index]}`,
                fontSize:
                  answers[0].length <= 50
                    ? "1.5rem"
                    : answers[0].length <= 100
                    ? "1.25rem"
                    : "1rem",
                overflowY: "auto",
              }}
            >
              {correctAnswers[0] === options[index] ? answers[0] : answers[1]}
            </button>
          </ReactCardFlip>
        ))}
      </div>
      <div className="flex justify-between">
        {currentQuestion === 1 ? (
          <button className="bg-white"> </button>
        ) : (
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 1}
            className="bg-white text-black"
          >
            &lt; Previous
          </button>
        )}
        <button onClick={handleNextQuestion} className="bg-white text-black">
          Next &gt;
        </button>
      </div>
    </div>
  );
}

export default StudentQuiz;
