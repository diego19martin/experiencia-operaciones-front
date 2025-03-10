export function ImageUpload({ children, onImageUpload, itemId }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          onImageUpload(compressedDataUrl, itemId); // <-- aquí pasas itemId
        };
        
        img.src = reader.result;
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden" 
        id={`image-upload-${itemId}`} // <-- ID único por cada item
      />
      <label htmlFor={`image-upload-${itemId}`} className="cursor-pointer">
        {children}
      </label>
    </div>
  );
}
