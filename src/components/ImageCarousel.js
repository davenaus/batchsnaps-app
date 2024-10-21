import React from 'react';

function ImageCarousel({ images, currentImageIndex, setCurrentImageIndex }) {
  return (
    <div id="carousel-container">
      <div id="image-carousel" className="flex overflow-x-auto">
        {images.map((img, index) => (
          <img
            key={index}
            src={img.image.src}
            alt={`Thumbnail ${index + 1}`}
            className={`w-16 h-16 object-cover mx-1 cursor-pointer ${index === currentImageIndex ? 'border-2 border-blue-500' : ''}`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="navigation-buttons-container">
          <button
            onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
            className="navigation-button navigation-button-prev"
          >
            <i className='bx bx-chevron-left'></i> Previous
          </button>
          <button
            onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
            className="navigation-button navigation-button-next"
          >
            Next <i className='bx bx-chevron-right'></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;