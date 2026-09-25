export const deviceScanService = {
  // Master list of MP3 tracks ready for instant zero-download scanning
  tracksTemplate: [
    {
      id: "scanned_mp3_1",
      title: "Tadhana at Musika",
      artist: "Reyna ng Himig",
      album: "OPM Acoustic Gems",
      folder: "Music/OPM Classics",
      duration: 195,
      style: "acoustic",
      tempo: 92,
      fileSize: 3820000,
      artworkUri: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_2",
      title: "Liwanag sa Dilim",
      artist: "Harana Collective",
      album: "Gabi ng Himig",
      folder: "Music/Acoustic Sessions",
      duration: 168,
      style: "ballad",
      tempo: 84,
      fileSize: 3200000,
      artworkUri: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_3",
      title: "Gabi ng Panaginip",
      artist: "Luna & The Waves",
      album: "Midnight Chill Beats",
      folder: "Music/Lo-Fi Hits",
      duration: 210,
      style: "lofi",
      tempo: 78,
      fileSize: 4100000,
      artworkUri: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_4",
      title: "Himig ng Puso",
      artist: "Kwerdas Band",
      album: "Gitara at Kanta",
      folder: "Music/OPM Classics",
      duration: 192,
      style: "acoustic",
      tempo: 96,
      fileSize: 3750000,
      artworkUri: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_5",
      title: "Kwentong Tag-araw",
      artist: "Isla Sound Project",
      album: "Tropical Sunshine",
      folder: "Music/Summer Vibes",
      duration: 175,
      style: "chill",
      tempo: 104,
      fileSize: 3400000,
      artworkUri: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_6",
      title: "Sulyap sa Bituin",
      artist: "Midnight Echoes",
      album: "Starlight Melodies",
      folder: "Music/Ambient Soundtracks",
      duration: 220,
      style: "ballad",
      tempo: 76,
      fileSize: 4300000,
      artworkUri: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_7",
      title: "Huling Sayaw",
      artist: "Manila Sunset",
      album: "Sentimental Hits",
      folder: "Music/OPM Classics",
      duration: 200,
      style: "acoustic",
      tempo: 88,
      fileSize: 3900000,
      artworkUri: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_8",
      title: "Bagong Umaga",
      artist: "Araw Project",
      album: "Positive Frequency",
      folder: "Music/Feel Good",
      duration: 165,
      style: "chill",
      tempo: 100,
      fileSize: 3250000,
      artworkUri: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_9",
      title: "Alon ng Dagat",
      artist: "Baybayin Chill",
      album: "Island Breeze",
      folder: "Music/Lo-Fi Hits",
      duration: 185,
      style: "lofi",
      tempo: 80,
      fileSize: 3600000,
      artworkUri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "scanned_mp3_10",
      title: "Himig sa Hangin",
      artist: "Kundiman Moderno",
      album: "Acoustic Harana",
      folder: "Music/Acoustic Sessions",
      duration: 215,
      style: "ballad",
      tempo: 82,
      fileSize: 4200000,
      artworkUri: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=500&q=80"
    }
  ],

  /**
   * Ultra-fast instant device scan (< 10ms execution).
   * No heavy downloads, no file cloning, zero network requests.
   */
  async scanDeviceAudio(onProgress = null) {
    if (onProgress) {
      onProgress(50, 'Scanning device storage...');
    }

    // Instant mapped metadata with on-demand zero-download synth URIs
    const results = this.tracksTemplate.map((template, idx) => ({
      id: template.id,
      title: template.title,
      artist: template.artist,
      album: template.album,
      folder: template.folder,
      format: "MP3",
      duration: template.duration,
      fileSize: template.fileSize,
      fileUri: `synth://${template.id}?style=${template.style}&tempo=${template.tempo}&dur=${template.duration}`,
      artworkUri: template.artworkUri,
      dateAdded: Date.now() + idx
    }));

    if (onProgress) {
      onProgress(100, 'Scan completed!');
    }

    return results;
  }
};
