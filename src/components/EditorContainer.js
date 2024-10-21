import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ImagePreview from './ImagePreview';
import Controls from './Controls';
import ImageCarousel from './ImageCarousel';
import AdWrapper from './AdWrapper';
import JSZip from 'jszip';
import './EditorContainer.css';
import './SplashPage.css';
import { saveAs } from 'file-saver';

function EditorContainer() {
  const [session, setSession] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [linkedDimensions, setLinkedDimensions] = useState(true);
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const exportCanvasRef = useRef(null);
  const settingsRef = useRef(null);
  const navigate = useNavigate();
  

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkPremiumStatus(session.user.id);
      }
    });
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkPremiumStatus(session.user.id);
      }
    });
  
    return () => subscription.unsubscribe();
  }, []);
  
  const checkPremiumStatus = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single();
  
    if (error) {
      console.error('Error checking premium status:', error);
    } else {
      setIsPremium(data.plan_type === 'premium' || data.plan_type === 'lifetime');
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setIsPremium(false);
      navigate('/');
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };


  const handleManageBilling = () => {
    // Implement billing management logic here
    console.log('Manage billing clicked');
  };

  const createImageObject = (img) => ({
    image: img,
    canvasWidth: img.width,
    canvasHeight: img.height,
    roundness: 0,
    padding: 0,
    backgroundColor: '#ffffff',
    transparentBg: true,
    borderWidth: 0,
    borderColor: '#000000',
    shadowBlur: 0,
    shadowColor: '#000000',
    shadowOpacity: 100,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    customBackgroundImage: null  // This will be handled separately
  });

  const handleFiles = (files) => {
    if (!session && images.length + files.length > 3) {
      setShowSignInPopup(true);
      return;
    }
    if (session && !isPremium && images.length + files.length > 5) {
      setShowUpgradePopup(true);
      return;
    }

    for (let file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            setImages(prevImages => [...prevImages, createImageObject(img)]);
            if (images.length === 0) {
              setCurrentImageIndex(0);
            }
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const triggerFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFiles(e.target.files);
    input.click();
  };

  const updateImageAttribute = (attribute, value) => {
    if (currentImageIndex === -1) return;
    setImages(prevImages => prevImages.map((img, index) =>
      index === currentImageIndex ? { ...img, [attribute]: value } : img
    ));
  };

  const downloadImage = () => {
    if (currentImageIndex === -1 || !exportCanvasRef.current) return;
    const canvas = exportCanvasRef.current;
    let maxResolution = isPremium ? Math.max(canvas.width, canvas.height) : 1080;
    
    if (!isPremium && Math.max(canvas.width, canvas.height) > maxResolution) {
      const scaleFactor = maxResolution / Math.max(canvas.width, canvas.height);
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = canvas.width * scaleFactor;
      scaledCanvas.height = canvas.height * scaleFactor;
      const ctx = scaledCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      canvas = scaledCanvas;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `edited_screenshot_${currentImageIndex + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  const applyToAll = useCallback((attributesToApply) => {
    if (images.length <= 1 || currentImageIndex === -1) return;
  
    const currentImage = images[currentImageIndex];
  
    setImages(prevImages => prevImages.map((img, index) => 
      index !== currentImageIndex
        ? { ...img, ...attributesToApply.reduce((acc, attr) => ({ ...acc, [attr]: currentImage[attr] }), {}) }
        : img
    ));
  }, [images, currentImageIndex]);
  
  const deleteImage = useCallback(() => {
    if (images.length > 0) {
      setImages(prevImages => {
        const newImages = prevImages.filter((_, index) => index !== currentImageIndex);
        if (newImages.length > 0) {
          setCurrentImageIndex(prevIndex => prevIndex % newImages.length);
        } else {
          setCurrentImageIndex(-1);
        }
        return newImages;
      });
    }
  }, [images.length, currentImageIndex]);

  const downloadAll = useCallback(async () => {
    const zip = new JSZip();
  
    const renderImage = (img) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.canvasWidth;
        canvas.height = img.canvasHeight;
        const ctx = canvas.getContext('2d');
    
        // Apply background
        if (img.customBackgroundImage) {
          const bgImg = img.customBackgroundImage;
          const bgAspect = bgImg.width / bgImg.height;
          const canvasAspect = canvas.width / canvas.height;
          
          let bgWidth, bgHeight, bgX, bgY;
    
          if (bgAspect > canvasAspect) {
            bgHeight = canvas.height;
            bgWidth = bgHeight * bgAspect;
            bgY = 0;
            bgX = (canvas.width - bgWidth) / 2;
          } else {
            bgWidth = canvas.width;
            bgHeight = bgWidth / bgAspect;
            bgX = 0;
            bgY = (canvas.height - bgHeight) / 2;
          }
    
          ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight);
        } else if (!img.transparentBg) {
          ctx.fillStyle = img.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    
        // Calculate image dimensions
        const imageAspectRatio = img.image.width / img.image.height;
        let imageWidth = canvas.width - (img.padding * 2);
        let imageHeight = imageWidth / imageAspectRatio;
        if (imageHeight > canvas.height - (img.padding * 2)) {
          imageHeight = canvas.height - (img.padding * 2);
          imageWidth = imageHeight * imageAspectRatio;
        }
        const imageX = (canvas.width - imageWidth) / 2;
        const imageY = (canvas.height - imageHeight) / 2;
    
        // Create a temporary canvas for the image with effects
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
    
        // Apply roundness
        tempCtx.beginPath();
        const roundness = img.roundness;
        tempCtx.moveTo(imageX + roundness, imageY);
        tempCtx.arcTo(imageX + imageWidth, imageY, imageX + imageWidth, imageY + imageHeight, roundness);
        tempCtx.arcTo(imageX + imageWidth, imageY + imageHeight, imageX, imageY + imageHeight, roundness);
        tempCtx.arcTo(imageX, imageY + imageHeight, imageX, imageY, roundness);
        tempCtx.arcTo(imageX, imageY, imageX + imageWidth, imageY, roundness);
        tempCtx.closePath();
        tempCtx.clip();
    
        // Draw image
        tempCtx.drawImage(img.image, imageX, imageY, imageWidth, imageHeight);
    
        // Apply border
        if (img.borderWidth > 0) {
          tempCtx.strokeStyle = img.borderColor;
          tempCtx.lineWidth = img.borderWidth;
          tempCtx.stroke();
        }
    
        // Draw the temporary canvas onto the main canvas
        ctx.drawImage(tempCanvas, 0, 0);
    
  // Apply drop shadow
  if (img.shadowBlur > 0 || img.shadowOffsetX !== 0 || img.shadowOffsetY !== 0) {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = canvas.width;
    shadowCanvas.height = canvas.height;
    const shadowCtx = shadowCanvas.getContext('2d');

    shadowCtx.shadowBlur = img.shadowBlur;
    shadowCtx.shadowColor = `${img.shadowColor}${Math.round(img.shadowOpacity * 2.55).toString(16).padStart(2, '0')}`;
    shadowCtx.shadowOffsetX = img.shadowOffsetX;
    shadowCtx.shadowOffsetY = img.shadowOffsetY;

    shadowCtx.drawImage(canvas, 0, 0);
    ctx.drawImage(shadowCanvas, 0, 0);
  }

  // Apply glow (independently of drop shadow)
  if (img.glowStrength > 0) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = canvas.width;
    glowCanvas.height = canvas.height;
    const glowCtx = glowCanvas.getContext('2d');

    glowCtx.drawImage(canvas, 0, 0);
    glowCtx.globalCompositeOperation = 'source-atop';
    glowCtx.shadowColor = img.glowColor;
    glowCtx.shadowBlur = img.glowStrength;
    glowCtx.shadowOffsetX = 0;
    glowCtx.shadowOffsetY = 0;

    glowCtx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(glowCanvas, 0, 0);
  }
    
        canvas.toBlob(resolve, 'image/png');
      });
    };
  
    for (let i = 0; i < images.length; i++) {
      const blob = await renderImage(images[i]);
      zip.file(`edited_screenshot_${i + 1}.png`, blob);
    }
  
    // Generate the zip file and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'edited_screenshots.zip');
  }, [images]);

  return (
    <AdWrapper isPremium={isPremium}>
      <div className="editor-container">
        <header className="editor-header">
          <div className="editor-logo">BatchSnaps</div>
          <div className="editor-settings" ref={settingsRef}>
            <button 
              className="editor-settings-button" 
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            >
              <i className='bx bx-cog'></i>
            </button>
            {showSettingsDropdown && (
              <div className="editor-settings-dropdown">
                {session ? (
                  <>
                    <span className="editor-settings-item user-name">Hi, {session.user.user_metadata.full_name}</span>
                    {isPremium ? (
                      <button className="editor-settings-item" onClick={handleManageBilling}>Manage Billing</button>
                    ) : (
                      <button className="editor-settings-item" onClick={handleUpgrade}>Upgrade</button>
                    )}
                    <button className="editor-sign-out-button" onClick={handleSignOut}>Sign Out</button>
                  </>
                ) : (
                  <button className="editor-settings-item" onClick={handleSignIn}>Sign In</button>
                )}
              </div>
            )}
          </div>
        </header>
        <div className="editor-content">
          {images.length === 0 ? (
            <div className="editor-drop-area" onClick={triggerFileUpload}>
              <i className='bx bx-upload'></i>
              <p>Drop images here or click to upload</p>
            </div>
          ) : (
            <>
              <div className="editor-main">
                <div className="image-preview-container">
                  <ImagePreview
                    currentImage={images[currentImageIndex]}
                    triggerFileUpload={triggerFileUpload}
                    handleFiles={handleFiles}
                    exportCanvasRef={exportCanvasRef}
                    updateImageAttribute={updateImageAttribute}
                  />
                </div>
                {images.length > 1 && (
                  <ImageCarousel
                    images={images}
                    currentImageIndex={currentImageIndex}
                    setCurrentImageIndex={setCurrentImageIndex}
                  />
                )}
              </div>
              <div className="editor-controls">
                <Controls
                  currentImage={images[currentImageIndex]}
                  updateImageAttribute={updateImageAttribute}
                  linkedDimensions={linkedDimensions}
                  setLinkedDimensions={setLinkedDimensions}
                  triggerFileUpload={triggerFileUpload}
                  deleteImage={deleteImage}
                  downloadImage={downloadImage}
                  applyToAll={applyToAll}
                  downloadAll={downloadAll}
                  isMultipleImages={images.length > 1}
                  isPremium={isPremium}
                  session={session}
                />
              </div>
            </>
          )}
        </div>
        {showSignInPopup && (
          <div className="editor-sign-in-popup">
            <h2>Sign in to edit more than 3 photos</h2>
            <p>You've reached the limit for guest users. Sign in to edit up to 5 photos!</p>
            <button className="editor-popup-button" onClick={() => { handleSignIn(); setShowSignInPopup(false); }}>Sign In</button>
            <button className="editor-close-button" onClick={() => setShowSignInPopup(false)}>Close</button>
          </div>
        )}
        {showUpgradePopup && (
          <div className="editor-upgrade-popup">
            <h2>Upgrade to Premium</h2>
            <p>You've reached the limit of 5 photos for free users. Upgrade to edit unlimited photos!</p>
            <button className="editor-popup-button" onClick={() => { handleUpgrade(); setShowUpgradePopup(false); }}>Upgrade</button>
            <button className="editor-close-button" onClick={() => setShowUpgradePopup(false)}>Close</button>
          </div>
        )}
      </div>
    </AdWrapper>
  );
}

export default EditorContainer;