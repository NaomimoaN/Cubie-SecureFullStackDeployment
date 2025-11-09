// client/src/components/teacher/homework/TeacherHomeworkInputForm.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import homeworkService from "../../../services/homeworkService";
import { getAllSubjects } from "../../../services/subjectService";
import { getWeeksBySubjectId } from "../../../services/weekService";
import useAuth from "../../../hooks/useAuth";
import { CORE_COMPETENCIES } from "../../../utils/coreCompetencies";
import RichTextEditor from "../../common/RichTextEditor";
import {
  ClockIcon,
  UploadIcon,
  FileIcon,
  BinIcon,
} from "../../../assets/Icons";

//This is the flag for demo//////////////////////
const ENABLE_DEMO_FEATURE = true;
const DEMO_RICH_TEXT_CONTENT = `
<p>Here are your challenges for this homework:</p><ol><li><p><em>Read the Clock! </em>-&nbsp;Look closely at each clock and write down the exact time it shows.</p></li><li><p><em>Draw the Hands!</em> -&nbsp;Draw the hour and minute hands on the empty clock to accurately show <strong>3:15</strong>.</p></li><li><p><em>Solve the Equations! </em>-&nbsp;Tackle each math problem and find the correct answer.</p></li><li><p><em>Compare the Numbers! </em>-&nbsp;Use <strong>&lt; (less than)</strong>, <strong>&gt; (greater than)</strong>, or <strong>= (equal to)</strong> to show how the two numbers compare.</p></li></ol><p></p>
`;
///////////////////////////////////////////////

function TeacherHomeworkInputForm() {
  const { subjectId, homeworkId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const dueDateInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    week: "",
    rubricEmerging: "",
    rubricDeveloping: "",
    rubricProficient: "",
    rubricExtending: "",
    coreCompetencies: [],
    status: "draft",
    subject: subjectId || "",
  });
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const isEditMode = !!homeworkId;

  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!authLoading && user) {
        setLoading(true);
        setError(null);
        try {
          if (subjectId) {
            const fetchedWeeks = await getWeeksBySubjectId(subjectId);
            setWeeks(fetchedWeeks);
          } else {
            setWeeks([]);
          }

          if (isEditMode) {
            const fetchedHomework = await homeworkService.getHomeworkById(
              homeworkId
            );
            setFormData({
              title: fetchedHomework.title || "",
              description: fetchedHomework.description || "",
              dueDate: fetchedHomework.dueDate
                ? new Date(fetchedHomework.dueDate).toISOString().slice(0, 16)
                : "",
              week: fetchedHomework.weekObjectId?._id || "",
              rubricEmerging: fetchedHomework.rubricEmerging || "",
              rubricDeveloping: fetchedHomework.rubricDeveloping || "",
              rubricProficient: fetchedHomework.rubricProficient || "",
              rubricExtending: fetchedHomework.rubricExtending || "",
              coreCompetencies: fetchedHomework.coreCompetencies || [],
              status: fetchedHomework.status || "draft",
              subject: fetchedHomework.subject?._id || subjectId || "",
            });
            setExistingFiles(fetchedHomework.files || []);
          } else {
            setFormData((prev) => ({ ...prev, subject: subjectId || "" }));
          }
        } catch (err) {
          console.error("Error loading data:", err);
          setError(
            err.response?.data?.message ||
              "Failed to load form data. Please try again."
          );
        } finally {
          setLoading(false);
        }
      } else if (!authLoading && !user) {
        setError("Not authenticated. Please log in.");
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId, homeworkId, isEditMode, authLoading, user]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDescriptionChange = useCallback((html) => {
    setFormData((prev) => ({ ...prev, description: html }));
  }, []);

  const handleCoreCompetencyChange = useCallback((e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentCompetencies = prev.coreCompetencies;
      if (checked) {
        return {
          ...prev,
          coreCompetencies: [...currentCompetencies, value],
        };
      } else {
        return {
          ...prev,
          coreCompetencies: currentCompetencies.filter((c) => c !== value),
        };
      }
    });
  }, []);

  const handleFileChange = useCallback((e) => {
    setFiles(Array.from(e.target.files));
  }, []);

  const handleRemoveNewFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveExistingFile = useCallback((s3Key) => {
    setExistingFiles((prev) => prev.filter((file) => file.s3Key !== s3Key));
    setFilesToDelete((prev) => [...prev, s3Key]);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    setFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleClockIconClick = useCallback(() => {
    if (dueDateInputRef.current) {
      dueDateInputRef.current.showPicker();
    }
  }, []);

  const handleSaveAsDraft = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setMessage(null);
      setShowSavedModal(false);

      try {
        const data = new FormData();
        for (const key in formData) {
          if (key === "coreCompetencies") {
            data.append(key, JSON.stringify(formData[key]));
          } else {
            data.append(key, formData[key]);
          }
        }
        files.forEach((file) => {
          data.append("files", file);
        });

        if (filesToDelete.length > 0) {
          data.append("s3KeysToDelete", JSON.stringify(filesToDelete));
        }

        data.set("status", "draft");

        let response;
        if (isEditMode) {
          response = await homeworkService.updateHomework(homeworkId, data);
        } else {
          response = await homeworkService.createHomework(data);
        }
        setMessageType("success");
        setShowSavedModal(true);
        setTimeout(() => {
          setShowSavedModal(false);
          navigate(`/teacher/course-editor/${subjectId}/homework`);
        }, 2000);
      } catch (err) {
        console.error("Submission error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to save homework draft. Please try again."
        );
        setMessageType("error");
        clearMessage();
      } finally {
        setLoading(false);
      }
    },
    [
      formData,
      files,
      filesToDelete,
      isEditMode,
      homeworkId,
      subjectId,
      clearMessage,
      navigate,
    ]
  );

  const handlePreview = useCallback(() => {
    navigate(`/teacher/course-editor/${subjectId}/homework/preview`, {
      state: {
        homeworkTitle: formData.title,
        homeworkDescription: formData.description,
        dueDate: formData.dueDate,
        selectedWeekId: formData.week,
        newFiles: files,
        existingFiles: existingFiles,
        filesToDelete: filesToDelete,
        rubricEmerging: formData.rubricEmerging,
        rubricDeveloping: formData.rubricDeveloping,
        rubricProficient: formData.rubricProficient,
        rubricExtending: formData.rubricExtending,
        selectedCompetencies: formData.coreCompetencies,
        currentSubjectId: subjectId,
        homeworkId: homeworkId,
      },
    });
  }, [
    formData,
    files,
    existingFiles,
    filesToDelete,
    subjectId,
    homeworkId,
    navigate,
  ]);

  // -------------Demo------------------------------------------
  const handleTitleClick = useCallback(() => {
    if (ENABLE_DEMO_FEATURE) {
      setFormData((prev) => ({
        ...prev,
        title: "Time and Math Fun!",
      }));
    }
  }, [ENABLE_DEMO_FEATURE]);

  const handleRubricEmergingClick = useCallback(() => {
    if (ENABLE_DEMO_FEATURE) {
      setFormData((prev) => ({
        ...prev,
        rubricEmerging: `Beginning to demonstrate learning in relation to the learning standards but is not yet doing so consistently.

< 60%`,
      }));
    }
  }, [ENABLE_DEMO_FEATURE]);

  const handleRubricDevelopingClick = useCallback(() => {
    if (ENABLE_DEMO_FEATURE) {
      setFormData((prev) => ({
        ...prev,
        rubricDeveloping: `Demonstrating learning in relation to the learning standards with growing consistency. The student is showing initial understanding but is still in the process of developing their competency in relation to the learning standards.

60% - 79%.`,
      }));
    }
  }, [ENABLE_DEMO_FEATURE]);

  const handleRubricProficientClick = useCallback(() => {
    if (ENABLE_DEMO_FEATURE) {
      setFormData((prev) => ({
        ...prev,
        rubricProficient: `Proficient when they demonstrate the expected learning in relation to the learning standards.

80% - 89%`,
      }));
    }
  }, [ENABLE_DEMO_FEATURE]);

  const handleRubricExtendingClick = useCallback(() => {
    if (ENABLE_DEMO_FEATURE) {
      setFormData((prev) => ({
        ...prev,
        rubricExtending: `Demonstrate learning, in relation to learning standards, with increasing depth and complexity.

> 90% `,
      }));
    }
  }, [ENABLE_DEMO_FEATURE]);

  const handleSelectWeekClick = useCallback(() => {
    if (ENABLE_DEMO_FEATURE) {
      setFormData((prev) => ({
        ...prev,
        week: weeks.length > 0 ? weeks[0]._id : "",
      }));
    }
  }, [ENABLE_DEMO_FEATURE, weeks]);
  // -------------

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Authenticating...</p>
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-red-500 text-lg">
          Forbidden: You do not have permission to view this page.
        </p>
      </div>
    );
  }

  if (loading && isEditMode && !formData.title) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Loading homework data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-[26px] font-medium text-primeblack mb-6">
        {isEditMode ? "Edit Homework" : "Create Homework"}
      </h1>

      <form className="bg-white">
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-primeblack mb-1"
          >
            Title <span className="text-red-500"></span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            onClick={ENABLE_DEMO_FEATURE ? handleTitleClick : undefined}
            className="mt-1 bg-white text-primeblack block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
            placeholder="Add title"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-primeblack mb-1"
          >
            Instructions
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Write some instructions"
            className="min-h-[150px]"
            enableDemoFeature={ENABLE_DEMO_FEATURE} // Demo
            demoContent={DEMO_RICH_TEXT_CONTENT} // Demo
            isEditMode={isEditMode} // Demo
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
          <div className="w-full md:w-5/12">
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-primeblack mb-1"
            >
              Due Date and Time
            </label>
            <div className="relative mt-1">
              <input
                type="datetime-local"
                name="dueDate"
                id="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="bg-white text-primeblack block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                placeholder="MMMM DD, YY"
                ref={dueDateInputRef}
                step="900"
              />
              <button
                type="button"
                onClick={handleClockIconClick}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer bg-transparent border-none focus:outline-none"
                aria-label="Open date and time picker"
              >
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="w-full md:w-5/12">
            <label
              htmlFor="week"
              className="block text-sm font-medium text-primeblack mb-1"
            >
              Select Week
            </label>
            <select
              name="week"
              id="week"
              value={formData.week}
              onChange={handleChange}
              onClick={ENABLE_DEMO_FEATURE ? handleSelectWeekClick : undefined}
              className="bg-white text-primeblack block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="" className="text-gray3">
                Select Week
              </option>
              {weeks.map((week) => (
                <option key={week._id} value={week._id}>
                  Week {week.weekNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-primeblack mb-1">
            Attachments
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md
              ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray1"
              }
            `}
          >
            <div className="text-center">
              <UploadIcon className="text-primeblack mx-auto h-6 w-6" />
              <p className="mt-1 text-sm text-gray-600">
                Choose a file or drag and drop here
              </p>
              <input
                id="fileUploadInput"
                name="files"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() =>
                  document.getElementById("fileUploadInput").click()
                }
                className="mt-2 px-4 py-2 rounded-full border border-gra shadow-sm text-sm font-medium text-primeblack bg-gray2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Files
              </button>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-2 text-sm text-primeblack">
              {" "}
              <ul className="list-disc pl-5">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center py-1">
                    {" "}
                    <span className="flex items-center">
                      {" "}
                      <FileIcon
                        fileName={file.name}
                        className="mr-2 h-5 w-5 text-primeblack"
                      />
                      <span className="font-semibold">{file.name}</span>{" "}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(index)}
                      className="ml-1 bg-white border-none"
                      title="Remove file"
                    >
                      <BinIcon className="h-5 w-5 text-primeblack hover:text-orange2" />{" "}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isEditMode && existingFiles.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Existing Files:
              <ul className="list-disc pl-5">
                {existingFiles.map((file) => (
                  <li
                    key={file.s3Key}
                    className="flex items-center justify-between"
                  >
                    <span>{file.fileName}</span>
                    <div className="flex items-center"></div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-primeblack mb-2">Rubric</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-grayblue1 p-2">
            <div>
              <label
                htmlFor="rubricEmerging"
                className="block text-center bg-blue1 text-sm font-medium text-primeblack mb-2 py-2"
              >
                Emerging
              </label>
              <textarea
                name="rubricEmerging"
                id="rubricEmerging"
                rows="2"
                value={formData.rubricEmerging}
                onChange={handleChange}
                onClick={
                  ENABLE_DEMO_FEATURE ? handleRubricEmergingClick : undefined
                }
                className="mt-1 h-[130px] text-primeblack bg-white block w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter criteria"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="rubricDeveloping"
                className="block text-center bg-blue1 text-sm font-medium text-primeblack mb-2 py-2"
              >
                Developing
              </label>
              <textarea
                name="rubricDeveloping"
                id="rubricDeveloping"
                rows="2"
                value={formData.rubricDeveloping}
                onChange={handleChange}
                onClick={
                  ENABLE_DEMO_FEATURE ? handleRubricDevelopingClick : undefined
                }
                className="mt-1 h-[130px] text-primeblack bg-white block w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter criteria"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="rubricProficient"
                className="block text-center bg-blue1 text-sm font-medium text-primeblack mb-2 py-2"
              >
                Proficient
              </label>
              <textarea
                name="rubricProficient"
                id="rubricProficient"
                rows="2"
                value={formData.rubricProficient}
                onChange={handleChange}
                onClick={
                  ENABLE_DEMO_FEATURE ? handleRubricProficientClick : undefined
                }
                className="mt-1 h-[130px] text-primeblack bg-white block w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter criteria"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="rubricExtending"
                className="block text-center bg-blue1 text-sm font-medium text-primeblack mb-2 py-2"
              >
                Extending
              </label>
              <textarea
                name="rubricExtending"
                id="rubricExtending"
                rows="2"
                value={formData.rubricExtending}
                onChange={handleChange}
                onClick={
                  ENABLE_DEMO_FEATURE ? handleRubricExtendingClick : undefined
                }
                className="mt-1 h-[130px] text-primeblack bg-white block w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter criteria"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-primeblack mb-2">
            Core Competencies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
            {CORE_COMPETENCIES.map((competency) => (
              <div key={competency.id} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={competency.id}
                    name="coreCompetencies"
                    type="checkbox"
                    value={competency.id}
                    checked={formData.coreCompetencies.includes(competency.id)}
                    onChange={handleCoreCompetencyChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor={competency.id}
                    className="font-medium text-primeblack"
                  >
                    {competency.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/teacher/course-editor/${subjectId}/homework`)
            }
            className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-primeblack bg-gray1 hover:bg-gray3
             border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSaveAsDraft}
            disabled={loading}
            className={`px-4 py-2 border border-transparent rounded-full text-sm font-medium text-primeblack ${
              loading
                ? "bg-gray2 cursor-not-allowed"
                : "bg-gray2 hover:bg-gray3 border-none text-primeblack"
            }`}
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className={`px-4 py-2 border border-transparent rounded-full text-sm font-medium text-white ${
              loading
                ? "bg-orange1 cursor-not-allowed"
                : "bg-orange1 hover:bg-orange2 border-none text-primeblack"
            }`}
          >
            Preview
          </button>
        </div>
      </form>

      {showSavedModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center relative w-[35vw] h-[40vh] justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-800">Saved</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherHomeworkInputForm;
