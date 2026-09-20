export const parseMetadata = async (fileObj) => {
  let title = fileObj.name || "Unknown Track";
  // Remove file extension
  title = title.replace(/\.[^/.]+$/, "");

  let duration = 0;
  try {
    const objectUrl = URL.createObjectURL(fileObj);
    const tempAudio = new Audio();
    await new Promise((resolve) => {
      tempAudio.onloadedmetadata = () => {
        duration = Math.round(tempAudio.duration) || 0;
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
      tempAudio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
      tempAudio.src = objectUrl;
    });
  } catch (e) {
    console.warn("Could not determine duration ahead of time:", e);
  }

  return {
    title: title,
    artist: "Artist",
    album: "Album",
    duration: duration,
    artwork: null
  };
};

/* JGFMusic v1.0.2 */
