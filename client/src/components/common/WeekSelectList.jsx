/**
 * A reusable list component for selecting a week.
 * It displays weeks in a list format with visual selection indicators.
 */
import React from "react";

const WeekSelectList = ({
  weeks,
  selectedWeekId,
  onWeekChange,
  disabled = false,
  maxHeight = "max-h-[calc(100vh-150px)]",
  showWeekNumbers = true,
}) => {
  const handleWeekSelect = (weekId) => {
    if (!disabled) {
      onWeekChange(weekId);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`rounded-md w-[146px] bg-gray1 ${maxHeight} overflow-y-auto shadow-sm`}
      >
        {!weeks || weeks.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">
            No weeks found for this subject.
          </div>
        ) : (
          <ul className="space-y-0 pt-2 pb-10 flex flex-col items-center">
            {weeks.map((week) => (
              <li key={week._id} className="last:border-b-0">
                <button
                  onClick={() => handleWeekSelect(week._id)}
                  className={`
                    px-3 py-3 my-1 text-left transition-all duration-150 rounded-md w-[130px] border-none
                    ${
                      selectedWeekId === week._id
                        ? "py-2 bg-blue1 font-medium"
                        : "bg-gray1 text-primeblack hover:bg-gray3"
                    }
                    ${
                      disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                  `}
                  disabled={disabled}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 overflow-hidden">
                      <span
                        className={`
                          text-sm block truncate
                          ${
                            selectedWeekId === week._id
                              ? "font-medium text-primeblack"
                              : "text-primeblack"
                          }
                        `}
                      >
                        <span className="font-semibold text-primeblack">
                          Week {week.weekNumOfTerm}
                        </span>
                        {/* {week.title} */}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WeekSelectList;
