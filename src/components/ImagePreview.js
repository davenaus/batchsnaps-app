import React, { useEffect, useRef, useState, useCallback } from 'react';

function ImagePreview({ currentImage, triggerFileUpload, handleFiles, exportCanvasRef, updateImageAttribute }) {
  const previewCanvasRef = useRef(null);
  const canvasOutlineRef = useRef(null);
  const containerRef = useRef(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  // Add touch state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPinching, setIsPinching] = useState(false);
  const [startDistance, setStartDistance] = useState(0);

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setStartDistance(distance);
    } else {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
    } else {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
  };

  // Your existing updateCanvasOutline function
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

  // Your existing updatePreview function (keep exactly as is)
  const updatePreview = useCallback(() => {
    if (!currentImage || !exportCanvasRef.current) {
      if (canvasOutlineRef.current) {
        canvasOutlineRef.current.style.display = 'none';
      }
      return;
    }

    const previewCanvas = previewCanvasRef.current;
    const exportCanvas = exportCanvasRef.current;
    const previewCtx = previewCanvas.getContext('2d', { alpha: true });
    const exportCtx = exportCanvas.getContext('2d', { alpha: true });
    const container = containerRef.current;

    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Set export canvas size based on image dimensions
    exportCanvas.width = currentImage.canvasWidth;
    exportCanvas.height = currentImage.canvasHeight;

    // Set preview canvas size with DPI adjustment
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    previewCanvas.width = containerWidth * dpr;
    previewCanvas.height = containerHeight * dpr;
    
    // Set canvas CSS size
    previewCanvas.style.width = `${containerWidth}px`;
    previewCanvas.style.height = `${containerHeight}px`;

    // Scale context for high DPI displays
    previewCtx.scale(dpr, dpr);

    // Enable high-quality image smoothing
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.imageSmoothingQuality = 'high';
    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = 'high';

    // Calculate scale and position
    const scaleX = (containerWidth - 40) / currentImage.canvasWidth;
    const scaleY = (containerHeight - 40) / currentImage.canvasHeight;
    const scale = Math.min(scaleX, scaleY);
    const scaledWidth = currentImage.canvasWidth * scale;
    const scaledHeight = currentImage.canvasHeight * scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    // Clear canvases
    previewCtx.clearRect(0, 0, containerWidth, containerHeight);
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportCanvas.width;
    tempCanvas.height = exportCanvas.height;
    const tempCtx = tempCanvas.getContext('2d', { alpha: true });

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

    // Create canvas for image effects
    const effectsCanvas = document.createElement('canvas');
    effectsCanvas.width = tempCanvas.width;
    effectsCanvas.height = tempCanvas.height;
    const effectsCtx = effectsCanvas.getContext('2d', { alpha: true });

    // Apply roundness
    effectsCtx.beginPath();
    const roundness = currentImage.roundness;
    effectsCtx.moveTo(imageX + roundness, imageY);
    effectsCtx.arcTo(imageX + imageWidth, imageY, imageX + imageWidth, imageY + imageHeight, roundness);
    effectsCtx.arcTo(imageX + imageWidth, imageY + imageHeight, imageX, imageY + imageHeight, roundness);
    effectsCtx.arcTo(imageX, imageY + imageHeight, imageX, imageY, roundness);
    effectsCtx.arcTo(imageX, imageY, imageX + imageWidth, imageY, roundness);
    effectsCtx.closePath();
    effectsCtx.clip();

    // Draw image with high quality
    effectsCtx.drawImage(currentImage.image, imageX, imageY, imageWidth, imageHeight);

    // Apply border
    if (currentImage.borderWidth > 0) {
      effectsCtx.strokeStyle = currentImage.borderColor;
      effectsCtx.lineWidth = currentImage.borderWidth;
      effectsCtx.stroke();
    }

    // Apply drop shadow
    if (currentImage.shadowBlur > 0 || currentImage.shadowOffsetX !== 0 || currentImage.shadowOffsetY !== 0) {
      tempCtx.shadowBlur = currentImage.shadowBlur;
      tempCtx.shadowColor = `${currentImage.shadowColor}${Math.round(currentImage.shadowOpacity * 2.55).toString(16).padStart(2, '0')}`;
      tempCtx.shadowOffsetX = currentImage.shadowOffsetX;
      tempCtx.shadowOffsetY = currentImage.shadowOffsetY;
    }

    // Draw the effects canvas onto temp canvas
    tempCtx.drawImage(effectsCanvas, 0, 0);

    // Reset shadow settings
    tempCtx.shadowBlur = 0;
    tempCtx.shadowOffsetX = 0;
    tempCtx.shadowOffsetY = 0;

    // Apply glow effect
    if (currentImage.glowStrength > 0) {
      tempCtx.shadowBlur = currentImage.glowStrength;
      tempCtx.shadowColor = currentImage.glowColor;
      tempCtx.globalCompositeOperation = 'source-atop';
      tempCtx.drawImage(effectsCanvas, 0, 0);
      tempCtx.globalCompositeOperation = 'source-over';
    }

    // Draw to export canvas
    exportCtx.drawImage(tempCanvas, 0, 0);

    // Draw to preview canvas with proper scaling
    previewCtx.drawImage(exportCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

    // Update outline
    updateCanvasOutline(offsetX, offsetY, scaledWidth, scaledHeight);

  }, [currentImage, previewSize, updateCanvasOutline]);

  // Your existing useEffects
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

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

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

  // Update your return JSX to include touch handlers
  return (
    <div
      id="image-preview"
      className="checkerboard"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          <canvas 
            ref={previewCanvasRef} 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              touchAction: 'none' // Added for better touch handling
            }}
          />
          <canvas 
            ref={exportCanvasRef} 
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <p>
          <i className='bx bx-image-add' style={{ fontSize: '3rem' }}></i><br />
          Drag and drop an image here, or double-click to upload
        </p>
      )}
      {currentImage && (
        <input 
          type="file" 
          id="background-image" 
          accept="image/*" 
          onChange={handleBackgroundImageUpload} 
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}

export default ImagePreview;