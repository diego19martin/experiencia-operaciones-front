export function ImageUpload({ children, onImageUpload }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onImageUpload(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload" />
      <label htmlFor="image-upload" className="cursor-pointer">
        {children}
      </label>
    </div>
  )
}

