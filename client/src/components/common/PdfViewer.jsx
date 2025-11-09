import React, { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

function PdfViewer({
  file,
  width,
  pageNumber = 1,
  onDocumentLoadSuccess,
  onLoadError,
  className,
  isPositioningText = false,
  onPdfClick,
  onRenderScale,
  onPdfPageRenderDimensions,
}) {
  const [numPages, setNumPages] = useState(null);
  const viewerContainerRef = useRef(null);

  const onDocumentLoadSuccessInternal = useCallback(
    ({ numPages: totalNumPages }) => {
      setNumPages(totalNumPages);
      if (onDocumentLoadSuccess) {
        onDocumentLoadSuccess({ numPages: totalNumPages });
      }
    },
    [onDocumentLoadSuccess]
  );

  const onPageRenderSuccess = useCallback(
    (page) => {
      const viewport = page.getViewport({ scale: 1 });
      const originalPdfWidth = viewport.width;
      const originalPdfHeight = viewport.height;

      let actualScale;
      let actualRenderedWidth;
      let actualRenderedHeight;

      if (width > 0 && originalPdfWidth > 0) {
        actualScale = width / originalPdfWidth;
        actualRenderedWidth = width;
        actualRenderedHeight = originalPdfHeight * actualScale;
      } else {
        console.warn(
          "PdfViewer: Invalid width prop, falling back to original PDF dimensions or default."
        );
        actualScale = 1;
        actualRenderedWidth = originalPdfWidth || 600;
        actualRenderedHeight = originalPdfHeight || 800;
      }

      if (onRenderScale) {
        onRenderScale(actualScale);
      }
      if (onPdfPageRenderDimensions) {
        onPdfPageRenderDimensions(actualRenderedWidth, actualRenderedHeight);
      }
    },
    [width, onRenderScale, onPdfPageRenderDimensions]
  );

  const handleViewerClick = useCallback(
    (e) => {
      if (isPositioningText && onPdfClick && viewerContainerRef.current) {
        const pdfPageElement = e.target.closest(".react-pdf__Page");

        if (pdfPageElement) {
          const rect = pdfPageElement.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          onPdfClick(x, y);
        }
      }
    },
    [isPositioningText, onPdfClick]
  );

  return (
    <div
      className={`pdf-viewer-container ${className || ""}`}
      style={{
        position: "relative",
        cursor: isPositioningText ? "crosshair" : "default",
        width: "100%",
        height: "100%",
        overflow: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
      ref={viewerContainerRef}
      onClick={handleViewerClick}
    >
      {width > 0 ? (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccessInternal}
          onLoadError={(error) => {
            if (onLoadError) onLoadError(error);
            console.error("Failed to load PDF document", error);
          }}
          className="document-container"
          noData="Loading PDF file..."
          loading="Loading PDF..."
          error="An error occurred while loading the PDF."
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            renderAnnotationLayer={true}
            renderTextLayer={true}
            onRenderSuccess={onPageRenderSuccess}
            className="pdf-page-content"
          />
        </Document>
      ) : (
        <div className="flex items-center justify-center h-full w-full text-gray-500">
          Loading PDF viewer...
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
