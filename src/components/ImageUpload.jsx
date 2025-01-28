"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"

export function ImageUpload({ onImageUpload }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
        onImageUpload(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="mt-4">
      <input
        type="file"
        accept="image/*"
        capture="camera"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button as="span" variant="outline">
          Subir foto
        </Button>
      </label>
      {previewUrl && (
        <img
          src={previewUrl || "/placeholder.svg"}
          alt="Preview"
          className="mt-2 w-full h-32 object-cover rounded"
        />
      )}
    </div>
  )
}
