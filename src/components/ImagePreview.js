import React, { useEffect, useRef, useState, useCallback } from 'react';

function ImagePreview({ currentImage, triggerFileUpload, handleFiles, exportCanvasRef, updateImageAttribute }) {
  const previewCanvasRef = useRef(null);
  const canvasOutlineRef = useRef(null);
  const containerRef = useRef(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const updateCanvasOutline = useCallback((x, y, width, height) => {
    if (!currentImage) {
      if (canvasOutlineRef.current) {
        canvasOutlineRef.current.style.display = 'none';
      }
      return;
    }

    const canvasOutline = canvasOutlineRef.current;
    if (canvasOutline) {
      canvasOutline.style.left = `${x}px`;
      canvasOutline.style.top = `${y}px`;
      canvasOutline.style.width = `${width}px`;
      canvasOutline.style.height = `${height}px`;
      canvasOutline.style.display = 'block';
    }
  }, [currentImage]);

  const updatePreview = useCallback(() => {
    if (!currentImage || !exportCanvasRef.current) {
      if (canvasOutlineRef.current) {
        canvasOutlineRef.current.style.display = 'none';
      }
      return;
    }

    const previewCanvas = previewCanvasRef.current;
    const exportCanvas = exportCanvasRef.current;
    const previewCtx = previewCanvas.getContext('2d');
    const exportCtx = exportCanvas.getContext('2d');
    const container = containerRef.current;

    // Set canvas sizes
    exportCanvas.width = currentImage.canvasWidth;
    exportCanvas.height = currentImage.canvasHeight;
    previewCanvas.width = previewSize.width;
    previewCanvas.height = previewSize.height;

    // Calculate scale and offsets
    const scaleX = (container.clientWidth - 40) / currentImage.canvasWidth;
    const scaleY = (container.clientHeight - 40) / currentImage.canvasHeight;
    const scale = Math.min(scaleX, scaleY);
    const scaledWidth = currentImage.canvasWidth * scale;
    const scaledHeight = currentImage.canvasHeight * scale;
    const offsetX = (previewCanvas.width - scaledWidth) / 2;
    const offsetY = (previewCanvas.height - scaledHeight) / 2;

    // Clear canvases
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Create temporary canvas for image processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = exportCanvas.width;
    tempCanvas.height = exportCanvas.height;

      // Apply background
      if (currentImage.customBackgroundImage) {
        const bgImg = currentImage.customBackgroundImage;
        const bgAspect = bgImg.width / bgImg.height;
        const canvasAspect = tempCanvas.width / tempCanvas.height;
        
        let bgWidth, bgHeight, bgX, bgY;
  
        if (bgAspect > canvasAspect) {
          bgHeight = tempCanvas.height;
          bgWidth = bgHeight * bgAspect;
          bgY = 0;
          bgX = (tempCanvas.width - bgWidth) / 2;
        } else {
          bgWidth = tempCanvas.width;
          bgHeight = bgWidth / bgAspect;
          bgX = 0;
          bgY = (tempCanvas.height - bgHeight) / 2;
        }
  
        tempCtx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight);
      } else if (!currentImage.transparentBg) {
        tempCtx.fillStyle = currentImage.backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }

    // Calculate image dimensions
    const imageAspectRatio = currentImage.image.width / currentImage.image.height;
    let imageWidth = tempCanvas.width - (currentImage.padding * 2);
    let imageHeight = imageWidth / imageAspectRatio;
    if (imageHeight > tempCanvas.height - (currentImage.padding * 2)) {
      imageHeight = tempCanvas.height - (currentImage.padding * 2);
      imageWidth = imageHeight * imageAspectRatio;
    }
    const imageX = (tempCanvas.width - imageWidth) / 2;
    const imageY = (tempCanvas.height - imageHeight) / 2;

    // Create another temporary canvas for the image with effects
    const imageCanvas = document.createElement('canvas');
    const imageCtx = imageCanvas.getContext('2d');
    imageCanvas.width = tempCanvas.width;
    imageCanvas.height = tempCanvas.height;

    // Apply roundness
    imageCtx.beginPath();
    const roundness = currentImage.roundness;
    imageCtx.moveTo(imageX + roundness, imageY);
    imageCtx.arcTo(imageX + imageWidth, imageY, imageX + imageWidth, imageY + imageHeight, roundness);
    imageCtx.arcTo(imageX + imageWidth, imageY + imageHeight, imageX, imageY + imageHeight, roundness);
    imageCtx.arcTo(imageX, imageY + imageHeight, imageX, imageY, roundness);
    imageCtx.arcTo(imageX, imageY, imageX + imageWidth, imageY, roundness);
    imageCtx.closePath();
    imageCtx.clip();

    // Draw image
    imageCtx.drawImage(currentImage.image, imageX, imageY, imageWidth, imageHeight);

    // Apply border
    if (currentImage.borderWidth > 0) {
      imageCtx.strokeStyle = currentImage.borderColor;
      imageCtx.lineWidth = currentImage.borderWidth;
      imageCtx.stroke();
    }

    // Apply drop shadow
    if (currentImage.shadowBlur > 0 || currentImage.shadowOffsetX !== 0 || currentImage.shadowOffsetY !== 0) {
      tempCtx.shadowBlur = currentImage.shadowBlur;
      tempCtx.shadowColor = `${currentImage.shadowColor}${Math.round(currentImage.shadowOpacity * 2.55).toString(16).padStart(2, '0')}`;
      tempCtx.shadowOffsetX = currentImage.shadowOffsetX;
      tempCtx.shadowOffsetY = currentImage.shadowOffsetY;
    }

    // Draw the image canvas onto the temp canvas (with shadow if applied)
    tempCtx.drawImage(imageCanvas, 0, 0);

    // Reset shadow
    tempCtx.shadowBlur = 0;
    tempCtx.shadowOffsetX = 0;
    tempCtx.shadowOffsetY = 0;

    // Apply glow
    if (currentImage.glowStrength > 0) {
      tempCtx.shadowBlur = currentImage.glowStrength;
      tempCtx.shadowColor = currentImage.glowColor;
      tempCtx.globalCompositeOperation = 'source-atop';
      tempCtx.drawImage(imageCanvas, 0, 0);
      tempCtx.globalCompositeOperation = 'source-over';
    }

    // Draw the temp canvas onto the export canvas
    exportCtx.drawImage(tempCanvas, 0, 0);

    // Draw the export canvas onto the preview canvas
    previewCtx.drawImage(exportCanvas, offsetX, offsetY, scaledWidth, scaledHeight);



    updateCanvasOutline(offsetX, offsetY, scaledWidth, scaledHeight);
}, [currentImage, previewSize, updateCanvasOutline]);

useEffect(() => {
  updatePreview();
}, [updatePreview]);

useEffect(() => {
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      setPreviewSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    }
  });

  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }

  return () => {
    resizeObserver.disconnect();
  };
}, []);

const handleBackgroundImageUpload = (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        updateImageAttribute('customBackgroundImage', img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeBackgroundImage = () => {
  updateImageAttribute('customBackgroundImage', null);
};

return (
  <div
    id="image-preview"
    className="checkerboard"
    ref={containerRef}
    onDragOver={(e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    }}
    onDrop={(e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    }}
    onDoubleClick={triggerFileUpload}
  >
    <div id="canvas-outline" ref={canvasOutlineRef}></div>
    {currentImage ? (
      <>
        <canvas ref={previewCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }}></canvas>
        <canvas ref={exportCanvasRef} style={{ display: 'none' }}></canvas>
      </>
    ) : (
      <p>
        <i className='bx bx-image-add' style={{ fontSize: '3rem' }}></i><br />
        Drag and drop an image here, or double-click to upload
      </p>
    )}
    {currentImage && (
      <div>
        <input 
          type="file" 
          id="background-image" 
          accept="image/*" 
          onChange={handleBackgroundImageUpload} 
          style={{ display: 'none' }}
        />


      </div>
    )}
  </div>
);
}

export default ImagePreview;