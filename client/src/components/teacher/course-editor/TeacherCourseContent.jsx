import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams } from "react-router-dom";
import WeekSelectList from "../../common/WeekSelectList";
import { updateWeek } from "../../../services/weekService";
import {
  createContent,
  updateContent,
  getContentsForWeek,
  downloadContentFile,
} from "../../../services/contentService";
import { getWeeksBySubjectId } from "../../../services/weekService";

import {
  PencilIcon,
  UploadIcon,
  FileIcon,
  BinIcon,
  DownloadIcon,
} from "../../../assets/Icons.jsx";

import DeleteAlert from "../../common/DeleteAlert.jsx";
import ContentLoader from "../../common/ContentLoader.jsx";

import RichTextEditor from "../../common/RichTextEditor";
import DOMPurify from "dompurify";

const TERM_WEEKS_MAP = {
  term1: { start: 1, end: 16 },
  term2: { start: 17, end: 26 },
  term3: { start: 27, end: 39 },
};

function TeacherCourseContent({ user }) {
  const { subjectId } = useParams();

  const [contentTitle, setContentTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState(null);

  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weeksLoading, setWeeksLoading] = useState(false);

  const [selectedTerm, setSelectedTerm] = useState("term1");
  const [reindexedWeeksByTerm, setReindexedWeeksByTerm] = useState({});

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [currentContentId, setCurrentContentId] = useState(null);

  const fileInputRef = useRef(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [s3KeyToDelete, setS3KeyToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const loadWeekContent = useCallback(
    async (weekIdToLoad, currentWeeksData) => {
      setLoading(true);

      try {
        const targetWeeks = currentWeeksData || weeks;
        const weekToDisplay = targetWeeks.find((w) => w._id === weekIdToLoad);

        if (!weekToDisplay) {
          console.warn(`Week with ID ${weekIdToLoad} not found.`);
          setContentTitle("");
          setDescription("");
          setUploadedFiles([]);
          setIsEditingContent(true);
          setCurrentContentId(null);
          return;
        }

        const contentsForWeek = await getContentsForWeek(
          subjectId,
          weekIdToLoad
        );

        let contentDoc = null;
        let initialTitle = "";
        let initialDescription = "";
        let currentFiles = [];

        if (contentsForWeek && contentsForWeek.length > 0) {
          contentDoc = contentsForWeek[0];
          setCurrentContentId(contentDoc._id);
          initialTitle = contentDoc.title || "";
          initialDescription = contentDoc.description || "";
          currentFiles = contentDoc.contents || [];
        } else {
          setCurrentContentId(null);
          initialTitle = weekToDisplay.title || "";
          initialDescription = weekToDisplay.description || "";
        }

        setContentTitle(initialTitle);
        setDescription(initialDescription);
        setUploadedFiles(currentFiles);

        setIsEditingContent(
          !(
            initialTitle.trim() ||
            initialDescription.trim() ||
            currentFiles.length > 0
          )
        );
      } catch (error) {
        console.error(
          "Failed to load week data (title/description/files):",
          error
        );
        setContentTitle("");
        setDescription("");
        setUploadedFiles([]);
        setIsEditingContent(true);
        setCurrentContentId(null);
      } finally {
        setLoading(false);
      }
    },
    [subjectId, weeks]
  );

  const loadWeeks = useCallback(async () => {
    setWeeksLoading(true);
    try {
      const weeksData = await getWeeksBySubjectId(subjectId);
      const sortedWeeks = Array.isArray(weeksData)
        ? weeksData.sort((a, b) => a.weekNumber - b.weekNumber)
        : [];
      setWeeks(sortedWeeks);

      const newReindexedWeeks = {
        term1: [],
        term2: [],
        term3: [],
      };

      let currentTerm1Week = 1;
      let currentTerm2Week = 1;
      let currentTerm3Week = 1;

      sortedWeeks.forEach((week) => {
        if (
          week.weekNumber >= TERM_WEEKS_MAP.term1.start &&
          week.weekNumber <= TERM_WEEKS_MAP.term1.end
        ) {
          newReindexedWeeks.term1.push({
            ...week,
            termWeekNumber: currentTerm1Week++,
          });
        } else if (
          week.weekNumber >= TERM_WEEKS_MAP.term2.start &&
          week.weekNumber <= TERM_WEEKS_MAP.term2.end
        ) {
          newReindexedWeeks.term2.push({
            ...week,
            termWeekNumber: currentTerm2Week++,
          });
        } else if (
          week.weekNumber >= TERM_WEEKS_MAP.term3.start &&
          week.weekNumber <= TERM_WEEKS_MAP.term3.end
        ) {
          newReindexedWeeks.term3.push({
            ...week,
            termWeekNumber: currentTerm3Week++,
          });
        }
      });
      setReindexedWeeksByTerm(newReindexedWeeks);

      let initialSelectedWeekIdForTerm = null;
      if (newReindexedWeeks.term1.length > 0) {
        initialSelectedWeekIdForTerm = newReindexedWeeks.term1[0]._id;
        setSelectedTerm("term1");
      } else if (newReindexedWeeks.term2.length > 0) {
        initialSelectedWeekIdForTerm = newReindexedWeeks.term2[0]._id;
        setSelectedTerm("term2");
      } else if (newReindexedWeeks.term3.length > 0) {
        initialSelectedWeekIdForTerm = newReindexedWeeks.term3[0]._id;
        setSelectedTerm("term3");
      }

      setSelectedWeekId(initialSelectedWeekIdForTerm);

      if (!initialSelectedWeekIdForTerm) {
        setContentTitle("");
        setDescription("");
        setUploadedFiles([]);
        setIsEditingContent(true);
        setCurrentContentId(null);
      }
    } catch (error) {
      console.error("Failed to load weeks:", error);
      setWeeks([]);
      setReindexedWeeksByTerm({});
      setSelectedWeekId(null);
      setContentTitle("");
      setDescription("");
      setUploadedFiles([]);
      setIsEditingContent(true);
      setCurrentContentId(null);
    } finally {
      setWeeksLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (subjectId) {
      loadWeeks();
    }
  }, [subjectId, loadWeeks]);

  useEffect(() => {
    if (selectedWeekId) {
      loadWeekContent(selectedWeekId, weeks);
    } else {
      setContentTitle("");
      setDescription("");
      setUploadedFiles([]);
      setIsEditingContent(true);
      setCurrentContentId(null);
    }
  }, [selectedWeekId, loadWeekContent, weeks]);

  const displayedWeeks = useMemo(() => {
    return reindexedWeeksByTerm[selectedTerm] || [];
  }, [reindexedWeeksByTerm, selectedTerm]);

  const handleTermChange = useCallback(
    (term) => {
      setSelectedTerm(term);
      setSelectedFiles([]);
      setUploadSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      if (reindexedWeeksByTerm[term] && reindexedWeeksByTerm[term].length > 0) {
        const firstWeekIdInTerm = reindexedWeeksByTerm[term][0]._id;
        setSelectedWeekId(firstWeekIdInTerm);
      } else {
        setSelectedWeekId(null);
      }
    },
    [reindexedWeeksByTerm]
  );

  const handleWeekChange = useCallback((weekId) => {
    setSelectedWeekId(weekId);
    setSelectedFiles([]);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }, []);

  const handleTitleChange = useCallback((e) => {
    setContentTitle(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((html) => {
    setDescription(html);
  }, []);

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      _tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
    }));
    setSelectedFiles(files);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleBrowseFilesClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!selectedWeekId || uploading || loading) return;
      fileInputRef.current.click();
    },
    [selectedWeekId, uploading, loading]
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedWeekId || uploading || loading) return;
      e.dataTransfer.dropEffect = "copy";
    },
    [selectedWeekId, uploading, loading]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedWeekId || uploading || loading) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
          file,
          _tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        }));
        setSelectedFiles((prev) => [...prev, ...droppedFiles]);
        setUploadSuccess(false);
      }
    },
    [selectedWeekId, uploading, loading]
  );

  const handleRemoveSelectedFile = useCallback((tempIdToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((f) => f._tempId !== tempIdToRemove)
    );
  }, []);

  const handleDownloadFile = useCallback(
    async (contentMongoId, s3Key, fileName) => {
      try {
        await downloadContentFile(contentMongoId, s3Key);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    },
    []
  );

  const handleDeleteUploadedFileClick = useCallback((s3Key) => {
    setS3KeyToDelete(s3Key);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setS3KeyToDelete(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDeleteUploadedFile = useCallback(async () => {
    setDeleteError(null);
    if (!s3KeyToDelete || !currentContentId) {
      console.error("Missing content ID or file S3 key for deletion.");
      setDeleteError("Deletion failed: Missing file information.");
      return;
    }

    setIsDeleteModalOpen(false);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("s3KeyToDelete", s3KeyToDelete);
      formData.append("title", contentTitle);
      formData.append("description", description);
      formData.append("week_id", selectedWeekId);
      formData.append("subject_id", subjectId);

      await updateContent(currentContentId, formData);
      await loadWeekContent(selectedWeekId, weeks);
      console.log(
        `Uploaded file with s3Key: ${s3KeyToDelete} has been deleted.`
      );
    } catch (error) {
      console.error("Error deleting uploaded file:", error);
      setDeleteError("Failed to delete the uploaded file. Please try again.");
    } finally {
      setLoading(false);
      setS3KeyToDelete(null);
    }
  }, [
    s3KeyToDelete,
    currentContentId,
    contentTitle,
    description,
    selectedWeekId,
    subjectId,
    loadWeekContent,
    weeks,
  ]);

  const handleSave = useCallback(async () => {
    if (!selectedWeekId) {
      return;
    }

    const isDescriptionEmpty =
      description.replace(/<[^>]*>/g, "").trim() === "";

    if (
      !contentTitle.trim() &&
      isDescriptionEmpty &&
      selectedFiles.length === 0 &&
      uploadedFiles.length === 0
    ) {
      return;
    }

    setLoading(true);
    setUploading(true);
    setUploadSuccess(false);

    let textContentSavedSuccessfully = false;
    let filesProcessedSuccessfully = false;

    try {
      const updateWeekPayload = {
        title: contentTitle,
        description: description,
      };
      await updateWeek(selectedWeekId, updateWeekPayload);
      console.log("Week content (title/description) saved successfully.");
      textContentSavedSuccessfully = true;
      setIsEditingContent(false);

      setWeeks((prevWeeks) =>
        prevWeeks.map((week) =>
          week._id === selectedWeekId
            ? { ...week, title: contentTitle, description: description }
            : week
        )
      );
      setReindexedWeeksByTerm((prevTerms) => {
        const updatedTerms = { ...prevTerms };
        for (const termKey in updatedTerms) {
          updatedTerms[termKey] = updatedTerms[termKey].map((week) =>
            week._id === selectedWeekId
              ? { ...week, title: contentTitle, description: description }
              : week
          );
        }
        return updatedTerms;
      });

      if (selectedFiles.length > 0 || (isEditingContent && currentContentId)) {
        const formData = new FormData();
        formData.append("title", contentTitle);
        formData.append("description", description);
        formData.append("week_id", selectedWeekId);
        formData.append("subject_id", subjectId);

        selectedFiles.forEach((wrappedFile) => {
          formData.append("contents", wrappedFile.file);
        });

        if (currentContentId) {
          await updateContent(currentContentId, formData);
        } else {
          const response = await createContent(formData);
          setCurrentContentId(response.content._id);
        }
        filesProcessedSuccessfully = true;
        setUploadSuccess(true);
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      if (filesProcessedSuccessfully || textContentSavedSuccessfully) {
        await loadWeekContent(selectedWeekId, weeks);
      }
    } catch (error) {
      console.error("Save operation failed:", error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }, [
    selectedWeekId,
    contentTitle,
    description,
    selectedFiles,
    uploadedFiles.length,
    subjectId,
    currentContentId,
    loadWeekContent,
    weeks,
    isEditingContent,
  ]);

  const isSaveButtonDisabled = !selectedWeekId || loading || uploading;

  return (
    <div className="flex">
      {/* {(loading || uploading) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <Loader />
        </div>
      )} */}
      {(loading || uploading) && <ContentLoader />}
      <div className="w-[146px]">
        <div className="flex justify-between mb-2 rounded-md bg-gray1">
          {Object.keys(TERM_WEEKS_MAP).map((termKey, index) => (
            <button
              key={termKey}
              onClick={() => handleTermChange(termKey)}
              disabled={weeksLoading}
              className={`px-3 py-2 h-[47px] text-sm font-medium rounded-md
                ${
                  selectedTerm === termKey
                    ? "bg-blue2 text-white w-[66px] focus:outline-none"
                    : "bg-gray1 text-indigo-800 hover:bg-gray3 border-none w-[40px]"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedTerm === termKey
                ? termKey.charAt(0).toUpperCase() +
                  termKey.slice(1).replace("term", "Term ")
                : (index + 1).toString()}{" "}
            </button>
          ))}
        </div>

        <WeekSelectList
          weeks={displayedWeeks}
          selectedWeekId={selectedWeekId}
          onWeekChange={handleWeekChange}
          disabled={weeksLoading || loading}
          loading={weeksLoading}
          errorMessage={
            displayedWeeks.length === 0 && !weeksLoading
              ? `No weeks available for ${
                  selectedTerm.charAt(0).toUpperCase() +
                  selectedTerm.slice(1).replace("term", "Term ")
                }`
              : null
          }
          showWeekNumbers={true}
          useTermWeekNumbers={true}
        />
      </div>

      <div className="flex-1 mx-12 bg-white">
        <h2 className="flex items-center text-contrast justify-between mb-8">
          {selectedWeekId &&
          !isEditingContent &&
          (contentTitle.trim() ||
            description.trim() ||
            uploadedFiles.length > 0) ? (
            <>
              <div>
                <span className="text-black text-xl font-semibold">
                  {contentTitle.trim() ||
                  description.replace(/<[^>]*>/g, "").trim()
                    ? contentTitle
                    : "No Title"}
                </span>
              </div>
              <div>
                <button
                  onClick={() => setIsEditingContent(true)}
                  className="bg-white border-none focus:outline-none"
                  title="Edit Content"
                >
                  <PencilIcon className="h-5 w-5 text-black hover:text-orange2" />
                </button>
              </div>
            </>
          ) : (
            <div>
              <span className="text-black text-[26px] font-medium">
                Add Content
              </span>
            </div>
          )}
        </h2>

        {/* {loading && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">
            Loading content...
          </div>
        )} */}

        {selectedWeekId && !loading && (
          <>
            {!isEditingContent &&
            (contentTitle.trim() ||
              description.replace(/<[^>]*>/g, "").trim() ||
              uploadedFiles.length > 0) ? (
              <div className="bg-white mt-5">
                {description.replace(/<[^>]*>/g, "").trim() ? (
                  <div
                    className="text-gray-800 prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(description),
                    }}
                  />
                ) : (
                  <p className="text-gray-500">
                    No description provided for this week.
                  </p>
                )}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-[14px] font-medium text-black mb-2">
                      Attachments
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={
                            file._id || file.s3Key || `uploaded-file-${index}`
                          }
                          className="flex justify-between items-center border-2 px-2 rounded-lg border-gray3 h-[48px] w-[302px] mb-2"
                        >
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadFile(
                                currentContentId,
                                file.s3Key,
                                file.fileName
                              );
                            }}
                            className="text-primeblack flex items-center hover:text-primeblack"
                          >
                            {file.fileName}
                            <DownloadIcon className="text-blue2 hover:text-orange2 ml-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="m-0">
                  <label
                    htmlFor="contentTitle"
                    className="block text-lg font-medium text-black mb-2"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="contentTitle"
                    className="mt-1 block w-full px-4 py-2 border bg-white border-gray3 rounded-md text-primeblack focus: outline-none"
                    value={contentTitle}
                    onChange={handleTitleChange}
                    placeholder="Write chapter or title"
                    disabled={!selectedWeekId || loading}
                  />
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="contentDescription"
                    className="block text-lg font-medium text-black mb-2"
                  >
                    Description
                  </label>
                  <RichTextEditor
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Write some content for this title"
                    readOnly={!selectedWeekId || loading}
                    className="min-h-[150px]"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-[14px] font-medium text-black mb-2">
                      Current Attachments
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={
                            file._id ||
                            file.s3Key ||
                            `uploaded-file-edit-${index}`
                          }
                          className="flex justify-between items-center border-2 px-2 rounded-lg border-gray-200 h-[48px] w-[302px] mb-2"
                        >
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadFile(
                                currentContentId,
                                file.s3Key,
                                file.fileName
                              );
                            }}
                            className="text-primeblack flex items-center hover:text-primeblack"
                          >
                            {file.fileName}
                            <DownloadIcon className="text-blue2 hover:text-orange2 ml-4" />
                          </a>
                          <button
                            onClick={() =>
                              handleDeleteUploadedFileClick(file.s3Key)
                            }
                            className="ml-4 bg-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                            title="Delete file"
                          >
                            <BinIcon className="h-5 w-5 text-primeblack hover:text-orange2" />{" "}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2 pt-2 border-gray-200">
                  <label
                    htmlFor="attachments-input"
                    className="block text-lg font-medium text-black"
                  >
                    {" "}
                    Attachments
                  </label>

                  <input
                    type="file"
                    id="attachments-input"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    disabled={!selectedWeekId || uploading || loading}
                  />
                  <div
                    className={`flex flex-col items-center justify-center p-6 border border-dashed rounded-lg text-center
                  ${
                    !selectedWeekId || uploading || loading
                      ? "border-gray-300 bg-gray-50 text-gray-400"
                      : "border-indigo-300 bg-gray-50 text-indigo-700 cursor-pointer"
                  }
                  transition-colors duration-200`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <UploadIcon className="w-8 h-8 text-primeblack" />
                    <p className="mt-2 text-xs font-medium text-black">
                      Choose files or drag and drop here
                    </p>
                    <button
                      type="button"
                      onClick={handleBrowseFilesClick}
                      disabled={!selectedWeekId || uploading || loading}
                      className={`mt-4 px-2 py-2 border border-transparent text-sm font-semibold w-[117px] h-[40px] rounded-full bg-gray2 text-primeblack shadow-sm${
                        !selectedWeekId || uploading || loading
                          ? "bg-gray-200  cursor-not-allowed"
                          : "bg-red-500 hover:bg-gray3 border-none"
                      } transition-colors duration-200`}
                    >
                      Browse files
                    </button>
                  </div>

                  {/* {uploading && (
                    <div className="mt-2 p-2 bg-blue-100 text-blue-800 rounded">
                      Uploading files... Please wait.
                    </div>
                  )} */}
                  {/* {uploadSuccess && (
                    <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
                      Files uploaded successfully!
                    </div>
                  )} */}
                </div>
              </>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-4 border-t pt-4 border-gray-200">
                <ul className="list-disc list-inside text-sm text-primeblack">
                  {selectedFiles.map((wrappedFile) => (
                    <li
                      key={wrappedFile._tempId}
                      className="flex items-center py-1"
                    >
                      <span className="flex items-center">
                        <FileIcon
                          fileName={wrappedFile.file.name}
                          className="mr-2 h-5 w-5 text-primeblack"
                        />
                        <span className="font-semibold">
                          {wrappedFile.file.name}
                        </span>{" "}
                      </span>
                      <button
                        onClick={() =>
                          handleRemoveSelectedFile(wrappedFile._tempId)
                        }
                        className="ml-1 text- bg-white border-none"
                        disabled={uploading || loading}
                        title="Remove file"
                      >
                        <BinIcon className="h-5 w-5 text-primeblack hover:text-orange2" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {isEditingContent && (
          <div className="flex justify-end mt-8 space-x-4">
            <button
              onClick={handleSave}
              disabled={isSaveButtonDisabled}
              className="px-6 py-3 bg-orange1 text-white font-semibold rounded-full hover:bg-orange2 border-none disabled:cursor-not-allowed"
            >
              {loading || uploading ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <DeleteAlert
        isOpen={isDeleteModalOpen}
        message="Are you sure you want to delete this file?"
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteUploadedFile}
        error={deleteError}
      />
    </div>
  );
}

export default TeacherCourseContent;
