// client/src/hooks/usePdfAnnotation.js

import { useState, useEffect, useRef, useCallback } from "react";
import homeworkService from "../services/homeworkService";
import submissionService from "../services/submissionService";
import annotationService from "../services/annotationService";
import { getS3KeyFromFileUrl } from "../utils/fileUtils";

export const usePdfAnnotation = (
  homeworkId,
  submission,
  showTemporaryMessage,
  pdfViewerContainerRect,
  userId
) => {
  const [activeHomeworkPreviewUrl, setActiveHomeworkPreviewUrl] =
    useState(null);
  const [activeHomeworkPreviewError, setActiveHomeworkPreviewError] =
    useState(null);
  const [activeHomeworkPreviewFileName, setActiveHomeworkPreviewFileName] =
    useState(null);
  const [showPreviewAnimated, setShowPreviewAnimated] = useState(false);
  const [pageAnnotations, setPageAnnotations] = useState({});
  const [activePdfPageNumber, setActivePdfPageNumber] = useState(1);

  const [currentAnnotationId, setCurrentAnnotationId] = useState(null);

  const [isAddingText, setIsAddingText] = useState(false);
  const [isPositioningText, setIsPositioningText] = useState(false);
  const [newTextAnnotation, setNewTextAnnotation] = useState(null);
  const textInputRef = useRef(null);

  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [draggingAnnotationId, setDraggingAnnotationId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [pdfRenderScale, setPdfRenderScale] = useState(1);
  const [currentPdfPageRenderedHeight, setCurrentPdfPageRenderedHeight] =
    useState(0);
  const [currentPdfPageRenderedWidth, setCurrentPdfPageRenderedWidth] =
    useState(0);

  const DEFAULT_FONT_SIZE = 16;

  const ESTIMATED_TEXTBOX_HEIGHT_IN_PDF_POINTS = DEFAULT_FONT_SIZE;

  const generateUniqueId = useCallback(
    () => `_${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  useEffect(() => {
    const urlToRevoke = activeHomeworkPreviewUrl;
    return () => {
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [activeHomeworkPreviewUrl]);

  useEffect(() => {
    if (isAddingText && newTextAnnotation && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isAddingText, newTextAnnotation]);

  const handleGlobalMouseMove = useCallback(
    (e) => {
      if (
        isDraggingAnnotation &&
        draggingAnnotationId &&
        currentPdfPageRenderedHeight > 0 &&
        currentPdfPageRenderedWidth > 0 &&
        pdfViewerContainerRect &&
        pdfViewerContainerRect.width > 0 &&
        pdfViewerContainerRect.height > 0
      ) {
        e.preventDefault();

        const safePdfRenderScale =
          Number.isFinite(pdfRenderScale) && pdfRenderScale !== 0
            ? pdfRenderScale
            : 1;

        const textHeightInWebPixels =
          ESTIMATED_TEXTBOX_HEIGHT_IN_PDF_POINTS * safePdfRenderScale;

        const mouseXInPdfContainer = e.clientX - pdfViewerContainerRect.left;
        const mouseYInPdfContainer = e.clientY - pdfViewerContainerRect.top;

        const newAnnotationWebPixelX = mouseXInPdfContainer - dragOffset.x;
        const newAnnotationWebPixelY = mouseYInPdfContainer - dragOffset.y;

        let annotationWidthInWebPixels;
        if (
          isAddingText &&
          newTextAnnotation &&
          newTextAnnotation.id === draggingAnnotationId
        ) {
          annotationWidthInWebPixels =
            newTextAnnotation.width * safePdfRenderScale;
        } else {
          const currentAnnotation = pageAnnotations[activePdfPageNumber]?.find(
            (ann) =>
              ann._id === draggingAnnotationId ||
              ann.id === draggingAnnotationId
          );
          annotationWidthInWebPixels =
            (currentAnnotation?.width || DEFAULT_FONT_SIZE * 5) *
            safePdfRenderScale;
        }

        const clampedWebPixelX = Math.max(
          0,
          Math.min(
            newAnnotationWebPixelX,
            currentPdfPageRenderedWidth - annotationWidthInWebPixels
          )
        );
        const clampedWebPixelY = Math.max(
          0,
          Math.min(
            newAnnotationWebPixelY,
            currentPdfPageRenderedHeight - textHeightInWebPixels
          )
        );

        const logicalX = clampedWebPixelX / safePdfRenderScale;
        const logicalY = clampedWebPixelY / safePdfRenderScale;

        if (
          newTextAnnotation &&
          newTextAnnotation.id === draggingAnnotationId
        ) {
          setNewTextAnnotation((prev) => ({
            ...prev,
            x: logicalX,
            y: logicalY,
          }));
        } else {
          setPageAnnotations((prev) => {
            const newAnnotations = { ...prev };
            const currentPageAnns = [
              ...(newAnnotations[activePdfPageNumber] || []),
            ];
            const annotationIndex = currentPageAnns.findIndex(
              (ann) =>
                ann._id === draggingAnnotationId ||
                ann.id === draggingAnnotationId
            );
            if (annotationIndex > -1) {
              currentPageAnns[annotationIndex] = {
                ...currentPageAnns[annotationIndex],
                x: logicalX,
                y: logicalY,
              };
              newAnnotations[activePdfPageNumber] = currentPageAnns;
            }
            return newAnnotations;
          });
        }
      }
    },
    [
      isDraggingAnnotation,
      draggingAnnotationId,
      dragOffset,
      newTextAnnotation,
      activePdfPageNumber,
      pdfRenderScale,
      currentPdfPageRenderedHeight,
      currentPdfPageRenderedWidth,
      pdfViewerContainerRect,
      ESTIMATED_TEXTBOX_HEIGHT_IN_PDF_POINTS,
      DEFAULT_FONT_SIZE,
      pageAnnotations,
      isAddingText,
    ]
  );

  const handleGlobalMouseUp = useCallback(() => {
    if (isDraggingAnnotation && draggingAnnotationId) {
      setIsDraggingAnnotation(false);
      setDraggingAnnotationId(null);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDraggingAnnotation, draggingAnnotationId]);

  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleFileAction = useCallback(
    async (fileData, isHomeworkFile, actionType = "download") => {
      try {
        let responseBlob;
        const s3Key = fileData.s3Key || getS3KeyFromFileUrl(fileData.fileURL);

        setActiveHomeworkPreviewError(null);

        if (isHomeworkFile) {
          if (!homeworkId || !s3Key) {
            const errMsg =
              "Failed to perform file action: Missing required data for homework file.";
            showTemporaryMessage(errMsg, "error");
            return;
          }
          responseBlob = await homeworkService.downloadHomeworkFile(
            homeworkId,
            s3Key
          );

          if (
            !(responseBlob instanceof Blob) ||
            responseBlob.type !== "application/pdf" ||
            responseBlob.size === 0
          ) {
            const errMsg =
              "The downloaded data is not a valid PDF file or is empty.";
            throw new Error(errMsg);
          }

          if (
            actionType === "preview" &&
            fileData.fileType === "application/pdf"
          ) {
            const url = URL.createObjectURL(responseBlob);
            if (activeHomeworkPreviewUrl) {
              URL.revokeObjectURL(activeHomeworkPreviewUrl);
            }
            setActiveHomeworkPreviewUrl(url);
            setActiveHomeworkPreviewFileName(fileData.fileName);
            setActiveHomeworkPreviewError(null);
            setShowPreviewAnimated(true);
            return;
          } else if (actionType === "preview") {
            const errMsg =
              "This file type cannot be previewed. Please download it instead.";
            showTemporaryMessage(errMsg, "error");
            return;
          }
        } else {
          if (!submission?._id || !s3Key) {
            const errMsg =
              "Failed to perform file action: Missing required data for submitted file.";
            showTemporaryMessage(errMsg, "error");
            return;
          }
          responseBlob = await submissionService.downloadSubmittedFile(
            submission._id,
            s3Key
          );

          if (!(responseBlob instanceof Blob) || responseBlob.size === 0) {
            const errMsg = "The downloaded data is not a file or is empty.";
            throw new Error(errMsg);
          }
        }

        const url = window.URL.createObjectURL(responseBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileData.fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setActiveHomeworkPreviewError("Failed to get or preview the file.");
        const displayMessage = `Failed to perform file action. ${
          err.message || ""
        }`;
        showTemporaryMessage(displayMessage, "error");
        console.error("DEBUG: File action error:", err);
      }
    },
    [homeworkId, submission, showTemporaryMessage, activeHomeworkPreviewUrl]
  );

  const onPdfRenderScaleCallback = useCallback((scale) => {
    setPdfRenderScale(scale);
  }, []);

  const onPdfPageRenderDimensionsCallback = useCallback((width, height) => {
    setCurrentPdfPageRenderedWidth(width);
    setCurrentPdfPageRenderedHeight(height);
  }, []);

  const handleAddTextAnnotation = useCallback(() => {
    if (!activeHomeworkPreviewUrl) {
      showTemporaryMessage(
        "Please open a PDF file before adding an annotation.",
        "error"
      );
      return;
    }
    if (
      !pdfViewerContainerRect ||
      pdfViewerContainerRect.width === 0 ||
      pdfViewerContainerRect.height === 0
    ) {
      showTemporaryMessage(
        "PDF viewer dimensions are not yet available. Please ensure the PDF is fully displayed.",
        "error"
      );
      return;
    }
    setNewTextAnnotation(null);
    setIsPositioningText(true);
    setIsAddingText(false);
  }, [activeHomeworkPreviewUrl, showTemporaryMessage, pdfViewerContainerRect]);

  const handlePdfClickForTextPlacement = useCallback(
    (clickX, clickY) => {
      if (
        isPositioningText &&
        currentPdfPageRenderedHeight > 0 &&
        currentPdfPageRenderedWidth > 0 &&
        pdfViewerContainerRect &&
        pdfViewerContainerRect.width > 0 &&
        pdfViewerContainerRect.height > 0
      ) {
        const currentScale =
          Number.isFinite(pdfRenderScale) && pdfRenderScale !== 0
            ? pdfRenderScale
            : 1;

        const logicalX = clickX / currentScale;
        const logicalY = clickY / currentScale;

        setNewTextAnnotation({
          id: generateUniqueId(),
          type: "text",
          pageNumber: activePdfPageNumber,
          x: logicalX,
          y: logicalY,
          text: "",
          fontSize: DEFAULT_FONT_SIZE,
          color: "blue",
          width: 200 / currentScale,
        });
        setIsAddingText(true);
        setIsPositioningText(false);
      } else {
        showTemporaryMessage(
          "Could not get PDF dimensions. Please ensure the PDF is fully displayed.",
          "error"
        );
      }
    },
    [
      isPositioningText,
      activePdfPageNumber,
      pdfRenderScale,
      currentPdfPageRenderedHeight,
      currentPdfPageRenderedWidth,
      showTemporaryMessage,
      DEFAULT_FONT_SIZE,
      pdfViewerContainerRect,
      generateUniqueId,
    ]
  );

  const handleNewTextAnnotationChange = useCallback(
    (e) => {
      const currentScale =
        Number.isFinite(pdfRenderScale) && pdfRenderScale !== 0
          ? pdfRenderScale
          : 1;

      setNewTextAnnotation((prev) =>
        prev
          ? {
              ...prev,
              text: e.target.value,
              width: Math.max(
                (DEFAULT_FONT_SIZE * 0.6 * 5) / currentScale,
                (e.target.value.length * (DEFAULT_FONT_SIZE * 0.6)) /
                  currentScale +
                  20 / currentScale
              ),
            }
          : null
      );
    },
    [pdfRenderScale, DEFAULT_FONT_SIZE]
  );

  const handleSaveTextAnnotation = useCallback(() => {
    if (newTextAnnotation?.text.trim()) {
      const finalX = Number.isFinite(newTextAnnotation.x)
        ? newTextAnnotation.x
        : 0;
      const finalY = Number.isFinite(newTextAnnotation.y)
        ? newTextAnnotation.y
        : 0;
      const finalWidth = Number.isFinite(newTextAnnotation.width)
        ? newTextAnnotation.width
        : DEFAULT_FONT_SIZE * 5;
      const finalFontSize = Number.isFinite(newTextAnnotation.fontSize)
        ? newTextAnnotation.fontSize
        : DEFAULT_FONT_SIZE;

      const annotationToSave = {
        ...newTextAnnotation,
        x: finalX,
        y: finalY,
        width: finalWidth,
        fontSize: finalFontSize,
        pageNumber: activePdfPageNumber,
      };

      setPageAnnotations((prev) => {
        const updatedAnnotations = {
          ...prev,
          [activePdfPageNumber]: [
            ...(prev[activePdfPageNumber] || []),
            annotationToSave,
          ],
        };
        return updatedAnnotations;
      });
    } else {
      showTemporaryMessage("Text annotation cannot be empty.", "error");
    }
    setNewTextAnnotation(null);
    setIsAddingText(false);
    setIsPositioningText(false);
  }, [
    newTextAnnotation,
    activePdfPageNumber,
    showTemporaryMessage,
    DEFAULT_FONT_SIZE,
  ]);

  const handleCancelTextAnnotation = useCallback(() => {
    setNewTextAnnotation(null);
    setIsAddingText(false);
    setIsPositioningText(false);
  }, []);

  const handleDeleteAnnotation = useCallback(
    (annotationIdToDelete) => {
      setPageAnnotations((prevAnnotations) => {
        const newAnnotations = { ...prevAnnotations };
        if (newAnnotations[activePdfPageNumber]) {
          newAnnotations[activePdfPageNumber] = newAnnotations[
            activePdfPageNumber
          ].filter(
            (annotation) =>
              (annotation._id || annotation.id) !== annotationIdToDelete
          );
        }
        return newAnnotations;
      });
      showTemporaryMessage("Annotation deleted.", "success");
    },
    [activePdfPageNumber, showTemporaryMessage]
  );

  const handleMouseDownOnAnnotation = useCallback(
    (e, annotationId) => {
      if (isAddingText || isPositioningText) return;
      e.stopPropagation();

      const currentAnnotation =
        (pageAnnotations[activePdfPageNumber] || []).find(
          (ann) => ann._id === annotationId || ann.id === annotationId
        ) ||
        (newTextAnnotation?.id === annotationId ? newTextAnnotation : null);

      if (
        currentAnnotation &&
        currentPdfPageRenderedHeight > 0 &&
        currentPdfPageRenderedWidth > 0 &&
        pdfViewerContainerRect &&
        pdfViewerContainerRect.width > 0 &&
        pdfViewerContainerRect.height > 0
      ) {
        setIsDraggingAnnotation(true);
        setDraggingAnnotationId(annotationId);

        const safePdfRenderScale =
          Number.isFinite(pdfRenderScale) && pdfRenderScale !== 0
            ? pdfRenderScale
            : 1;

        const annotationWebPixelX = currentAnnotation.x * safePdfRenderScale;
        const annotationWebPixelY = currentAnnotation.y * safePdfRenderScale;

        const mouseXInPdfContainer = e.clientX - pdfViewerContainerRect.left;
        const mouseYInPdfContainer = e.clientY - pdfViewerContainerRect.top;

        setDragOffset({
          x: mouseXInPdfContainer - annotationWebPixelX,
          y: mouseYInPdfContainer - annotationWebPixelY,
        });
      } else {
        showTemporaryMessage(
          "Could not get PDF dimensions. Please ensure the PDF is fully displayed.",
          "error"
        );
      }
    },
    [
      activePdfPageNumber,
      pageAnnotations,
      isAddingText,
      isPositioningText,
      newTextAnnotation,
      pdfRenderScale,
      currentPdfPageRenderedHeight,
      currentPdfPageRenderedWidth,
      pdfViewerContainerRect,
    ]
  );

  const closePdfPreview = useCallback(() => {
    setShowPreviewAnimated(false);
    setTimeout(() => {
      setActiveHomeworkPreviewUrl(null);
      setActiveHomeworkPreviewFileName(null);
      setActiveHomeworkPreviewError(null);
      setPageAnnotations({});
      setCurrentAnnotationId(null);
      setNewTextAnnotation(null);
      setIsAddingText(false);
      setIsPositioningText(false);
      setActivePdfPageNumber(1);
      setCurrentPdfPageRenderedHeight(0);
      setCurrentPdfPageRenderedWidth(0);
      setIsDraggingAnnotation(false);
      setDraggingAnnotationId(null);
      setDragOffset({ x: 0, y: 0 });
    }, 700);
  }, []);

  const saveAnnotationsToDb = useCallback(async () => {
    if (!submission || !submission._id || !userId) {
      showTemporaryMessage("failed to save annotation", "error");
      console.warn("Failed to save", { submission, userId });
      return null;
    }

    if (
      Object.keys(pageAnnotations).length === 0 ||
      Object.values(pageAnnotations).every((arr) => arr.length === 0)
    ) {
      if (currentAnnotationId) {
        try {
          await annotationService.deleteAnnotation(currentAnnotationId);
          setCurrentAnnotationId(null);
          showTemporaryMessage("Clean up all annotation", "info");
          return null;
        } catch (deleteError) {
          console.error("Error deleting empty annotations:", deleteError);
          showTemporaryMessage("failed to clear annotation", "error");
          return null;
        }
      }
      showTemporaryMessage("no annotation for save", "info");
      return null;
    }

    try {
      showTemporaryMessage("Stroing annotation...", "info");
      const submissionId = submission._id;
      const flattenedAnnotations = Object.values(pageAnnotations).flat();

      const savedAnnotation = await annotationService.saveAnnotations(
        submissionId,
        userId,
        flattenedAnnotations,
        currentAnnotationId
      );

      if (savedAnnotation && savedAnnotation._id) {
        setCurrentAnnotationId(savedAnnotation._id);
        showTemporaryMessage("Saved annotation", "success");
        return savedAnnotation._id;
      } else {
        throw new Error("No return saved annotation");
      }
    } catch (error) {
      console.error("Failed to save annotation:", error);
      showTemporaryMessage(
        `Failed to save annotation: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
      return null;
    }
  }, [
    submission,
    pageAnnotations,
    showTemporaryMessage,
    userId,
    currentAnnotationId,
  ]);

  const loadAnnotationsFromDb = useCallback(async () => {
    if (!submission?._id || !userId) {
      setPageAnnotations({});
      setCurrentAnnotationId(null);
      console.warn("Skip to loading");
      return;
    }

    try {
      showTemporaryMessage("loading annotation...", "info");
      const submissionId = submission._id;

      const studentAnnotationEntry = await annotationService.loadAnnotations(
        submissionId,
        userId
      );

      if (studentAnnotationEntry && studentAnnotationEntry.data) {
        if (Array.isArray(studentAnnotationEntry.data)) {
          const pagedData = studentAnnotationEntry.data.reduce((acc, ann) => {
            const pageNum = ann.pageNumber ? String(ann.pageNumber) : "1";
            if (!acc[pageNum]) {
              acc[pageNum] = [];
            }
            acc[pageNum].push({
              ...ann,
              id: ann._id || generateUniqueId(),
              pageNumber: parseInt(pageNum, 10),
            });
            return acc;
          }, {});

          setPageAnnotations(pagedData);
          setCurrentAnnotationId(studentAnnotationEntry._id);
          showTemporaryMessage("Load annotation", "success");
        } else {
          console.warn("Invalid type annotation:", studentAnnotationEntry.data);
          setPageAnnotations({});
          setCurrentAnnotationId(null);
          showTemporaryMessage(
            "Failed to load annotation due to invalid annotation type",
            "error"
          );
        }
      } else {
        setPageAnnotations({});
        setCurrentAnnotationId(null);
        showTemporaryMessage("No annotation for this submission", "info");
      }
    } catch (error) {
      console.error("Load error:", error);
      setPageAnnotations({});
      setCurrentAnnotationId(null);
      showTemporaryMessage(
        `Failed to load annotation: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  }, [submission?._id, userId, showTemporaryMessage, generateUniqueId]);

  useEffect(() => {
    if (submission?._id && userId) {
      loadAnnotationsFromDb();
    } else {
      setPageAnnotations({});
      setCurrentAnnotationId(null);
    }
  }, [submission?._id, userId, loadAnnotationsFromDb]);

  return {
    activeHomeworkPreviewUrl,
    activeHomeworkPreviewError,
    activeHomeworkPreviewFileName,
    showPreviewAnimated,
    pageAnnotations,
    activePdfPageNumber,
    isAddingText,
    isPositioningText,
    newTextAnnotation,
    textInputRef,
    draggingAnnotationId,
    currentAnnotationId,
    handleFileAction,
    onPdfRenderScale: onPdfRenderScaleCallback,
    onPdfPageRenderDimensions: onPdfPageRenderDimensionsCallback,
    currentPdfRenderScale: pdfRenderScale,
    currentPdfPageRenderedHeight,
    currentPdfPageRenderedWidth,
    handleAddTextAnnotation,
    handlePdfClickForTextPlacement,
    handleNewTextAnnotationChange,
    handleSaveTextAnnotation,
    handleCancelTextAnnotation,
    handleMouseDownOnAnnotation,
    setActivePdfPageNumber,
    closePdfPreview,
    handleDeleteAnnotation,
    saveAnnotationsToDb,
    loadAnnotationsFromDb,
  };
};
