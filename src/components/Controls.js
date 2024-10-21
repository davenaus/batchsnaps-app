import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function Controls({
  currentImage,
  updateImageAttribute,
  linkedDimensions,
  setLinkedDimensions,
  triggerFileUpload,
  deleteImage,
  downloadImage,
  applyToAll,
  downloadAll,
  isMultipleImages,
  isPremium,
  session
}) {
  const [showApplyToModal, setShowApplyToModal] = useState(false);
  const [showChoosePresetModal, setShowChoosePresetModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presets, setPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [attributesToApply, setAttributesToApply] = useState({});
  const [attributesToSave, setAttributesToSave] = useState({});
  
  const backgroundInputRef = useRef(null);

  useEffect(() => {
    if (isPremium && session) {
      fetchPresets();
    }
  }, [isPremium, session]);

  const fetchPresets = async () => {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching presets:', error);
    } else {
      setPresets(data);
    }
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim() || !isPremium) return;
  
    const selectedAttributes = Object.keys(attributesToSave).filter(key => attributesToSave[key]);
    
    const presetData = {
      name: newPresetName,
      user_id: session.user.id,
      settings: JSON.stringify(Object.fromEntries(
        Object.entries(currentImage).filter(([key]) => 
          selectedAttributes.includes(key) && key !== 'image' && key !== 'customBackgroundImage'
        )
      ))
    };
  
    const { data, error } = await supabase
      .from('presets')
      .insert([presetData]);
  
    if (error) {
      if (error.code === '42501') {
        console.error('Error saving preset: User does not have permission. They may not be a premium user.');
        // Show an error message to the user, perhaps prompting them to upgrade
      } else {
        console.error('Error saving preset:', error);
      }
    } else {
      fetchPresets();
      setShowSavePresetModal(false);
      setNewPresetName('');
      setAttributesToSave({});
    }
  };

  const deletePreset = async (presetId) => {
    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', presetId);

    if (error) {
      console.error('Error deleting preset:', error);
    } else {
      fetchPresets(); // Refresh the presets list
    }
  };

  const handleApplyPreset = (preset) => {
    const settings = JSON.parse(preset.settings);
    Object.keys(settings).forEach(key => {
      if (key !== 'image' && key !== 'customBackgroundImage') {
        updateImageAttribute(key, settings[key]);
      }
    });
    if (!settings.hasOwnProperty('backgroundColor')) {
      updateImageAttribute('backgroundColor', currentImage.backgroundColor);
    }
    if (!settings.hasOwnProperty('transparentBg')) {
      updateImageAttribute('transparentBg', currentImage.transparentBg);
    }
    setShowChoosePresetModal(false);
  };

  const handleApplyToAll = () => {
    const attributesToApplyArray = Object.keys(attributesToApply).filter(key => attributesToApply[key]);
    applyToAll(attributesToApplyArray);
    setShowApplyToModal(false);
  };

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

  const handleRemoveBackgroundImage = () => {
    updateImageAttribute('customBackgroundImage', null);
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  if (!currentImage) return null;

  return (
    <div id="controls">
      <div className="control-group">
        <details>
          <summary className={isPremium ? '' : 'premium'}>Presets</summary>
          <button
            onClick={() => setShowChoosePresetModal(true)}
            disabled={!isPremium || presets.length === 0}
          >
            Choose Preset
          </button>
          <button
            onClick={() => setShowSavePresetModal(true)}
            disabled={!isPremium}
          >
            Save Preset
          </button>
        </details>
      </div>
      <div className="control-group">
        <details>
          <summary>Canvas Size</summary>
          <div className="canvas-size-control">
            <input
              type="number"
              id="canvas-width"
              min="1"
              max="2000"
              value={currentImage.canvasWidth}
              onChange={(e) => {
                const newWidth = Math.max(1, parseInt(e.target.value) || 1);
                updateImageAttribute('canvasWidth', newWidth);
                if (linkedDimensions) {
                  const newHeight = Math.max(1, Math.round(newWidth / (currentImage.image.width / currentImage.image.height)));
                  updateImageAttribute('canvasHeight', newHeight);
                }
              }}
            />
            <button
              className="link-toggle"
              onClick={() => setLinkedDimensions(!linkedDimensions)}
            >
              <i className={`bx ${linkedDimensions ? 'bx-link' : 'bx-unlink'}`}></i>
            </button>
            <input
              type="number"
              id="canvas-height"
              min="1"
              max="2000"
              value={currentImage.canvasHeight}
              onChange={(e) => {
                const newHeight = Math.max(1, parseInt(e.target.value) || 1);
                updateImageAttribute('canvasHeight', newHeight);
                if (linkedDimensions) {
                  const newWidth = Math.max(1, Math.round(newHeight * (currentImage.image.width / currentImage.image.height)));
                  updateImageAttribute('canvasWidth', newWidth);
                }
              }}
            />
          </div>
        </details>
      </div>

      <div className="control-group">
        <details>
          <summary>Image Adjustments</summary>
          <label htmlFor="roundness">Roundness:</label>
          <input
            type="range"
            id="roundness"
            min="0"
            max="50"
            value={currentImage.roundness}
            onChange={(e) => updateImageAttribute('roundness', parseInt(e.target.value))}
          />
          <label htmlFor="padding">Padding:</label>
          <input
            type="range"
            id="padding"
            min="0"
            max="100"
            value={currentImage.padding}
            onChange={(e) => updateImageAttribute('padding', parseInt(e.target.value))}
          />
        </details>
      </div>

      <div className="control-group">
        <details>
          <summary>Background</summary>
          <label htmlFor="background-color">Color:</label>
          <input
            type="color"
            id="background-color"
            value={currentImage.backgroundColor}
            onChange={(e) => updateImageAttribute('backgroundColor', e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              id="transparent-bg"
              checked={currentImage.transparentBg}
              onChange={(e) => updateImageAttribute('transparentBg', e.target.checked)}
            />
            Transparent Background
          </label>
          <label htmlFor="background-image">Custom Background Image:</label>
          <input
            ref={backgroundInputRef}
            type="file"
            id="background-image"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            onClick={(e) => {
              e.target.value = null;
            }}
          />
          {currentImage.customBackgroundImage && (
            <>
              <img
                id="background-image-preview"
                src={currentImage.customBackgroundImage.src}
                alt="Background preview"
              />
              <button
                id="remove-bg-image"
                onClick={handleRemoveBackgroundImage}
              >
                Remove Background Image
              </button>
            </>
          )}
        </details>
      </div>

      <div className="control-group">
        <details>
          <summary>Border</summary>
          <label htmlFor="border-width">Width (%):</label>
          <input
            type="range"
            id="border-width"
            min="0"
            max="30"
            step="0.9"
            value={currentImage.borderWidth}
            onChange={(e) => updateImageAttribute('borderWidth', parseFloat(e.target.value))}
          />
          <label htmlFor="border-color">Color:</label>
          <input
            type="color"
            id="border-color"
            value={currentImage.borderColor}
            onChange={(e) => updateImageAttribute('borderColor', e.target.value)}
          />
        </details>
      </div>

      <div className="control-group">
        <details>
          <summary>Drop Shadow</summary>
          <label htmlFor="shadow-blur">Blur:</label>
          <input
            type="range"
            id="shadow-blur"
            min="0"
            max="50"
            value={currentImage.shadowBlur}
            onChange={(e) => updateImageAttribute('shadowBlur', parseInt(e.target.value))}
          />
          <label htmlFor="shadow-color">Color:</label>
          <input
            type="color"
            id="shadow-color"
            value={currentImage.shadowColor}
            onChange={(e) => updateImageAttribute('shadowColor', e.target.value)}
          />
          <label htmlFor="shadow-opacity">Opacity:</label>
          <input
            type="range"
            id="shadow-opacity"
            min="0"
            max="100"
            value={currentImage.shadowOpacity}
            onChange={(e) => updateImageAttribute('shadowOpacity', parseInt(e.target.value))}
          />
          <label htmlFor="shadow-offset-x">Offset X:</label>
          <input
            type="range"
            id="shadow-offset-x"
            min="-50"
            max="50"
            value={currentImage.shadowOffsetX}
            onChange={(e) => updateImageAttribute('shadowOffsetX', parseInt(e.target.value))}
          />
          <label htmlFor="shadow-offset-y">Offset Y:</label>
          <input
            type="range"
            id="shadow-offset-y"
            min="-50"
            max="50"
            value={currentImage.shadowOffsetY}
            onChange={(e) => updateImageAttribute('shadowOffsetY', parseInt(e.target.value))}
          />
        </details>
      </div>

         <div className="button-group">
        <button className="control-button" onClick={triggerFileUpload}>
          <i className='bx bx-upload'></i> Upload Image
        </button>
        <button className="control-button" onClick={deleteImage}>
          <i className='bx bx-trash'></i> Delete Image
        </button>
      </div>

      {isMultipleImages && (
        <div className="button-group">
          <button className="control-button" onClick={() => applyToAll(Object.keys(currentImage).filter(key => key !== 'image'))}>
            <i className='bx bx-copy'></i> Apply to All
          </button>
          <button className="control-button" onClick={() => setShowApplyToModal(true)}>
            <i className='bx bx-box'></i> Apply To...
          </button>
        </div>
      )}

      <div className="button-group">
        <button className="control-button" onClick={downloadImage}>
          <i className='bx bx-download'></i> Download Image
        </button>
        {isMultipleImages && (
          <button className="control-button" onClick={downloadAll}>
            <i className='bx bx-download'></i> Download All
          </button>
        )}
      </div>

      {showApplyToModal && (
        <div className="modal">
          <h2>Select attributes to apply</h2>
          {Object.keys(currentImage).filter(key => key !== 'image').map(key => (
            <label key={key}>
              <input
                type="checkbox"
                checked={attributesToApply[key] || false}
                onChange={(e) => setAttributesToApply(prev => ({ ...prev, [key]: e.target.checked }))}
              />
              {key}
            </label>
          ))}
          <button onClick={handleApplyToAll}>Apply</button>
          <button onClick={() => setShowApplyToModal(false)}>Cancel</button>
        </div>
      )}

      {showChoosePresetModal && (
        <div className="modal">
          <h2>Choose Preset</h2>
          {presets.map(preset => (
            <div key={preset.id} className="preset-item">
              <button onClick={() => handleApplyPreset(preset)}>
                {preset.name}
              </button>
              <button 
                className="delete-preset-btn" 
                onClick={() => deletePreset(preset.id)}
              >
                <i className='bx bx-trash'></i>
              </button>
            </div>
          ))}
          <button onClick={() => setShowChoosePresetModal(false)}>Cancel</button>
        </div>
      )}

      {showSavePresetModal && (
        <div className="modal">
          <h2>Save Preset</h2>
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Enter preset name"
          />
          <h3>Select attributes to save:</h3>
          {Object.keys(currentImage).filter(key => key !== 'image' && key !== 'customBackgroundImage').map(key => (
            <label key={key}>
              <input
                type="checkbox"
                checked={attributesToSave[key] || false}
                onChange={(e) => setAttributesToSave(prev => ({ ...prev, [key]: e.target.checked }))}
              />
              {key}
            </label>
          ))}
          <button onClick={handleSavePreset}>Save</button>
          <button onClick={() => {
            setShowSavePresetModal(false);
            setNewPresetName('');
            setAttributesToSave({});
          }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default Controls;