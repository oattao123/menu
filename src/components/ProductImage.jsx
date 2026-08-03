import React from 'react';
import { ClothingIcon } from './ClothingIcon';

// Shows the product's real photo when one was uploaded, otherwise the drawn icon.
export const ProductImage = ({ imageUrl, svgType, color, className = 'w-12 h-12', alt = '' }) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
      />
    );
  }
  return <ClothingIcon type={svgType} color={color} className={className} />;
};
