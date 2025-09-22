"use client";
import React from "react";
import styles from "@/styles/PhotoGallery.module.css";

export default function PhotoGallery({
  photos = [],
  totalCount = 0,   // միայն ինֆո նպատակով. պտույտը հիմնվում է photos-ի վրա
  hotelName = "",
}) {
  // Թեթև ֆիլտր + դեդուպլիկացիա
  const images = React.useMemo(() => {
    const arr = (photos || []).filter((s) => typeof s === "string" && s.trim().length > 0);
    return Array.from(new Set(arr));
  }, [photos]);

  const [idx, setIdx] = React.useState(0);
  const hasImages = images.length > 0;

  const show = React.useCallback(
    (i) => {
      const m = images.length;
      if (!m) return;
      // wrap-around
      const next = ((i % m) + m) % m;
      setIdx(next);
    },
    [images.length]
  );

  // reset/սահմանի շտկում, երբ նկարների ցուցակը թարմանում է
  React.useEffect(() => {
    if (idx >= images.length) setIdx(0);
  }, [images, idx]);

  // thumbnails՝ աջում 3 հատ
  const thumbs = React.useMemo(() => images.slice(1, 4), [images]);

  // Dev հուշում՝ եթե totalCount > images.length, ապա վերևից գալիս է մասամբ լցված photos prop
  React.useEffect(() => {
    if (totalCount > images.length) {
      console.debug(
        "[PhotoGallery] totalCount(", totalCount,
        ") > images.length(", images.length,
        ") → ծնող կոմպոնենտը, հավանաբար, փոխանցում է միայն մի մաս (օր. slice(0,5))."
      );
    }
  }, [totalCount, images.length]);

  return (
    <div className={styles.wrap}>
      {/* MAIN big image */}
      <div className={styles.main}>
        {hasImages ? (
          <>
            <img
              src={images[idx]}
              alt={`${hotelName || "Photo"} ${idx + 1}`}
              className={styles.img}
            />

            {images.length > 1 && (
              <>
                <button
                  className={`${styles.nav} ${styles.left}`}
                  aria-label="Previous photo"
                  onClick={() => show(idx - 1)}
                >
                  ‹
                </button>
                <button
                  className={`${styles.nav} ${styles.right}`}
                  aria-label="Next photo"
                  onClick={() => show(idx + 1)}
                >
                  ›
                </button>
                <div className={styles.counter}>
                  {idx + 1}/{images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.placeholder}>No photo</div>
        )}
      </div>

      {/* RIGHT thumbs (3 stacked) */}
      <div className={styles.side}>
        {thumbs.map((src, i) => {
          const absoluteIndex = i + 1;
          const active = idx === absoluteIndex;
          return (
            <button
              key={absoluteIndex}
              className={`${styles.thumb} ${active ? styles.active : ""}`}
              onClick={() => show(absoluteIndex)}
              aria-label={`Open photo ${absoluteIndex + 1}`}
            >
              {src ? (
                <img src={src} alt="" loading="lazy" />
              ) : (
                <div className={styles.placeholderSmall}>No photo</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}