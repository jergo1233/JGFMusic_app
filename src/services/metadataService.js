export const parseMetadata = async (fileObj) => {
  const originalName = fileObj.name || "Unknown Track.mp3";
  // Remove file extension
  let cleanName = originalName.replace(/\.[^/.]+$/, "").trim();
  const ext = (originalName.split('.').pop() || 'mp3').toUpperCase();

  let artist = "Audio Track";
  let title = cleanName;

  // Detect "Artist - Title" format common in MP3 files
  if (cleanName.includes(" - ")) {
    const parts = cleanName.split(" - ");
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }
  } else if (cleanName.includes(" — ")) {
    const parts = cleanName.split(" — ");
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" — ").trim();
    }
  }

  // Detect parent folder from webkitRelativePath if available
  let folderName = "";
  if (fileObj.webkitRelativePath) {
    const pathParts = fileObj.webkitRelativePath.split('/');
    if (pathParts.length > 1) {
      folderName = pathParts[pathParts.length - 2];
    }
  }

  let duration = 0;
  try {
    const objectUrl = URL.createObjectURL(fileObj);
    const tempAudio = new Audio();
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        resolve();
      }, 700);

      tempAudio.onloadedmetadata = () => {
        clearTimeout(timer);
        duration = Math.round(tempAudio.duration) || 0;
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        resolve();
      };
      tempAudio.onerror = () => {
        clearTimeout(timer);
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        resolve();
      };
      tempAudio.src = objectUrl;
    });
  } catch (e) {
    console.warn("Could not determine duration ahead of time:", e);
  }

  return {
    title: title || cleanName,
    artist: artist,
    album: folderName || "Device Files",
    folder: folderName,
    format: ext,
    duration: duration,
    artwork: null
  };
};

/* JGFMusic v1.0.2 */
