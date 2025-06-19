// components/RoomImageModal.js

import React from "react";
import styles from "@/styles/roomImageModal.module.css";

const RoomImageModal = ({ images, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>
        <div className={styles.imagesGrid}>
          {images && images.length > 0 ? (
            images.map((img, idx) => (
              <img key={idx} src={img} alt={`Room Image ${idx + 1}`} />
            ))
          ) : (
            <p>No images available for this room.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomImageModal;