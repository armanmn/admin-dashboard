import styles from "@/styles/imageUploader.module.css";
import React, { useRef } from "react";

const ImageUploader = ({ images, setImages }) => {
  const fileInputRef = useRef(null);
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);

    const filtered = files.filter((file) => {
      if (file.type === "image/avif") {
        alert("AVIF images not supported.");
        return false;
      }
      return ["image/jpeg", "image/png"].includes(file.type);
    });

    const newFiles = filtered.map((f) => ({ file: f, isMain: false }));
    setImages((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  // ✅ Reset input value so that re-selecting the same file won't be ignored
  if (fileInputRef.current) {
    fileInputRef.current.value = null;
  }

  const handleRemove = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const markAsMain = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    setImages(updated);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>Upload Room Images:</label>
      <input
        type="file"
        disabled={images.length >= 5}
        accept="image/jpeg,image/png"
        multiple
        onChange={handleFilesChange}
        ref={fileInputRef}
      />

      {images.length > 0 && (
        <div className={styles.previewGrid}>
          {images.map((img, i) => {
            const isMain = img.isMain;
            const url = img.url || URL.createObjectURL(img.file);

            return (
              <div key={i} className={styles.previewItem}>
                <img src={url} alt={`img-${i}`} className={styles.previewImg} />
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className={styles.removeBtn}
                >
                  ✖
                </button>
                <button
                  type="button"
                  onClick={() => markAsMain(i)}
                  className={isMain ? styles.mainBtnActive : styles.mainBtn}
                >
                  {isMain ? "Main ✓" : "Set Main"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
