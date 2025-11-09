// client/src/components/student/subject/StudentSubjectContent.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import WeekSelectList from "../../common/WeekSelectList";
import { getWeeksBySubjectId } from "../../../services/weekService";
import {
  getContentsForWeek,
  downloadContentFile,
} from "../../../services/contentService";
import { DownloadIcon } from "../../../assets/Icons";

// Import the new modal component
import CompletionModal from "../../common/CompletionModal";

import RichTextEditor from "../../common/RichTextEditor";

const TERM_DEFINITIONS = [
  { term: 1, startMonth: 7, startDay: 1, weeksInTerm: 24 },
  { term: 2, startMonth: 1, startDay: 1, weeksInTerm: 12 },
  { term: 3, startMonth: 4, startDay: 1, weeksInTerm: 12 },
];

const getCurrentTermAndWeekNumber = (now) => {
  const currentYear = now.getFullYear();

  const allTermCandidates = TERM_DEFINITIONS.map((def) => {
    let termStartYear = currentYear;
    if (def.startMonth > now.getMonth() + 1) {
      termStartYear = currentYear;
    } else if (def.startMonth < now.getMonth() + 1) {
      termStartYear = currentYear;
      const tempStartDate = new Date(
        termStartYear,
        def.startMonth - 1,
        def.startDay
      );
      const tempEndDate = new Date(tempStartDate.getTime());
      tempEndDate.setDate(tempStartDate.getDate() + def.weeksInTerm * 7 - 1);
      if (now > tempEndDate) {
        termStartYear = currentYear + 1;
      }
    }

    const termStartDate = new Date(
      termStartYear,
      def.startMonth - 1,
      def.startDay
    );
    const termEndDate = new Date(termStartDate.getTime());
    termEndDate.setDate(termStartDate.getDate() + def.weeksInTerm * 7 - 1);

    return {
      ...def,
      termStartDate: termStartDate,
      termEndDate: termEndDate,
    };
  });

  const currentTermInfo = allTermCandidates.find((termCandidate) => {
    return (
      now >= termCandidate.termStartDate && now <= termCandidate.termEndDate
    );
  });

  if (currentTermInfo) {
    const diffTime = Math.abs(
      now.getTime() - currentTermInfo.termStartDate.getTime()
    );
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
    return {
      term: currentTermInfo.term,
      weekNumOfTerm: diffWeeks,
    };
  }
  return null;
};

function StudentSubjectContent({ user }) {
  const { subjectId } = useParams();
  const [weekTitle, setWeekTitle] = useState("");
  const [weekDescription, setWeekDescription] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [displayedWeeks, setDisplayedWeeks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [weeksLoading, setWeeksLoading] = useState(false);

  const [contentsForSelectedWeek, setContentsForSelectedWeek] = useState([]);
  const [contentAvailable, setContentAvailable] = useState(false);

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [termInfo, setTermInfo] = useState(null);

  // New state for modal visibility
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadWeeks = async (subjectId) => {
    setWeeksLoading(true);
    try {
      const weeksData = await getWeeksBySubjectId(subjectId);
      setWeeks(Array.isArray(weeksData) ? weeksData : []);
    } catch (error) {
      showMessage("Failed to load weeks.", "error");
      setWeeks([]);
    } finally {
      setWeeksLoading(false);
    }
  };

  useEffect(() => {
    const currentDateTime = new Date();
    const currentTermAndWeek = getCurrentTermAndWeekNumber(currentDateTime);

    setTermInfo(currentTermAndWeek);

    if (weeks.length > 0 && currentTermAndWeek) {
      const filtered = weeks
        .filter((week) => Number(week.term) === currentTermAndWeek.term)
        .sort((a, b) => a.weekNumOfTerm - b.weekNumOfTerm);
      setDisplayedWeeks(filtered);

      if (filtered.length > 0 && !selectedWeek) {
        setSelectedWeek(filtered[0]._id);
      }
    } else {
      setDisplayedWeeks([]);
      setSelectedWeek(null);
    }
  }, [weeks, showMessage, selectedWeek]);

  const loadWeekContent = useCallback(
    async (subjectId, weekId) => {
      if (!weekId) {
        setWeekTitle("");
        setWeekDescription("");
        setContentsForSelectedWeek([]);
        setContentAvailable(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const currentWeek = displayedWeeks.find((w) => w._id === weekId);
        setWeekTitle(currentWeek ? currentWeek.title || "" : "");
        setWeekDescription(currentWeek ? currentWeek.description || "" : "");

        let fetchedContents = [];
        let primaryContentDoc = null;

        try {
          const responseContents = await getContentsForWeek(subjectId, weekId);

          if (responseContents && responseContents.length > 0) {
            primaryContentDoc = responseContents[0];
            setWeekTitle(primaryContentDoc.title || "");
            setWeekDescription(primaryContentDoc.description || "");

            fetchedContents = primaryContentDoc.contents
              .filter((file) => file && file.s3Key && file.fileName)
              .map((file, index) => ({
                _id:
                  file.s3Key ||
                  `${primaryContentDoc._id || "no-doc-id"}-${
                    file.fileName
                  }-${index}`,
                title: file.fileName,
                primaryContentDocId: primaryContentDoc._id,
                fileData: {
                  fileName: file.fileName,
                  fileURL: file.fileURL,
                  s3Key: file.s3Key,
                  size: file.size,
                  uploadedAt: file.uploadedAt,
                },
              }));
          } else {
            setWeekTitle(currentWeek ? currentWeek.title || "" : "");
            setWeekDescription(
              currentWeek ? currentWeek.description || "" : ""
            );
          }

          setContentsForSelectedWeek(fetchedContents);

          // contentAvailable の判定ロジックを修正
          setContentAvailable(
            weekDescription.trim().length > 0 || fetchedContents.length > 0
          );
        } catch (contentLoadError) {
          console.error(
            "Failed to load existing content files:",
            contentLoadError
          );
          showMessage("Failed to load existing content files.", "error");
          setContentsForSelectedWeek([]);
          setContentAvailable(false);
        }
      } catch (error) {
        console.error(
          "Failed to load week content (title/description/files):",
          error
        );
        showMessage("Failed to load week content.", "error");
        setWeekTitle("");
        setWeekDescription("");
        setContentsForSelectedWeek([]);
        setContentAvailable(false);
      } finally {
        setLoading(false);
      }
    },
    [displayedWeeks, showMessage]
  );

  useEffect(() => {
    if (subjectId) {
      loadWeeks(subjectId);
    }
  }, [subjectId]);

  useEffect(() => {
    if (selectedWeek && subjectId) {
      loadWeekContent(subjectId, selectedWeek);
    }
  }, [selectedWeek, subjectId, loadWeekContent]);

  const handleWeekChange = useCallback((weekId) => {
    setSelectedWeek(weekId);
  }, []);

  const handleDownloadFile = useCallback(
    async (primaryContentDocId, s3Key, fileName) => {
      try {
        await downloadContentFile(primaryContentDocId, s3Key);
        showMessage(`Started downloading '${fileName}'.`, "success");
        setShowCompletionModal(true);
      } catch (error) {
        showMessage(error.message || "Failed to download file.", "error");
      }
    },
    [showMessage]
  );

  // Function to close the modal
  const handleCloseCompletionModal = useCallback(() => {
    setShowCompletionModal(false);
  }, []);

  const headerText = useMemo(() => {
    const currentWeekObj = displayedWeeks.find(
      (week) => week._id === selectedWeek
    );
    let prefix = "";
    if (currentWeekObj) {
      prefix = `Week ${currentWeekObj.weekNumOfTerm} `;
    }

    if (selectedWeek) {
      if (weekTitle.trim()) {
        return prefix + weekTitle;
      }
    }
    return "";
  }, [selectedWeek, weekTitle, displayedWeeks]);

  const messageClass = useMemo(() => {
    if (messageType === "success") return "bg-green-100 text-green-700";
    if (messageType === "error") return "bg-red-100 text-red-700";
    if (messageType === "info") return "bg-blue-100 text-blue-700";
    return "";
  }, [messageType]);

  return (
    <div className="flex h-full p-10 box-border">
      <div className="h-full rounded-lg overflow-hidden">
        <WeekSelectList
          weeks={displayedWeeks}
          selectedWeekId={selectedWeek}
          onWeekChange={handleWeekChange}
          disabled={weeksLoading || loading}
          maxHeight="max-h-[calc(100vh-200px)]"
          errorMessage={
            displayedWeeks.length === 0 && !weeksLoading
              ? "No weeks available for this subject in the current term."
              : null
          }
        />
      </div>

      <div
        className={`flex-1 ml-10 max-w-4xl mx-auto p-2 bg-white rounded-lg h-full overflow-y-auto
        ${
          selectedWeek && !loading && !contentAvailable
            ? "flex flex-col justify-center items-center"
            : ""
        }
      `}
      >
        <h2 className="text-[26px] font-medium text-gray-800 mb-6 flex items-center">
          {headerText}
        </h2>
        {loading && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">
            Loading content...
          </div>
        )}
        {message && (
          <div className={`p-3 mb-4 rounded ${messageClass}`}>{message}</div>
        )}
        {selectedWeek && !loading ? (
          <>
            {contentAvailable ? (
              <>
                <div>
                  {weekDescription.trim() ? (
                    <RichTextEditor
                      value={weekDescription}
                      readOnly={true}
                      className="mb-4"
                    />
                  ) : null}{" "}
                </div>

                {contentsForSelectedWeek.length > 0 && (
                  <div className="mt-4 border-t pt-4 border-gray-200">
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                      {contentsForSelectedWeek.map((content) => (
                        <li
                          key={content._id}
                          className="flex justify-between items-center border-2 px-2 rounded-md border-gray-200 h-[48px] w-[302px] bg-trasnparent"
                        >
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (
                                content.fileData &&
                                content.fileData.s3Key &&
                                content.fileData.fileName &&
                                content.primaryContentDocId
                              ) {
                                handleDownloadFile(
                                  content.primaryContentDocId,
                                  content.fileData.s3Key,
                                  content.fileData.fileName
                                );
                              } else {
                                showMessage(
                                  "File information or content ID is missing.",
                                  "error"
                                );
                              }
                            }}
                            className="flex items-center justify-between flex-grow text-primeblack hover:text-primeblack"
                          >
                            <span className="truncate pr-2">
                              {content.title ||
                                content.fileData?.fileName ||
                                "Untitled file"}
                            </span>
                            <DownloadIcon className="text-blue2 hover:text-orange2 ml-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 bg-white rounded-lg text-center w-full">
                <img
                  src="/icons/Dinosaur.svg"
                  alt="Content not available"
                  className="mx-auto h-10 w-10 text-yellow-400 mb-4"
                />
                <p className="text-lg font-medium text-gray-800">Hang tight!</p>
                <p className="mt-2 text-sm text-gray-700">
                  Your teacher hasn't made this part available yet.
                </p>
              </div>
            )}
          </>
        ) : (
          !loading &&
          !weeksLoading &&
          displayedWeeks.length === 0 && (
            <div className="mt-8 p-6 bg-yellow-50 rounded-lg text-center shadow-sm">
              <p className="text-lg font-medium text-yellow-800">
                This subject has no week content for this term yet.
              </p>
              <p className="mt-2 text-sm text-yellow-700">
                Please wait for the teacher to add content.
              </p>
            </div>
          )
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal onClose={handleCloseCompletionModal} />
      )}
    </div>
  );
}

export default StudentSubjectContent;
