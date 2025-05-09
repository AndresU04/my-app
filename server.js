
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
app.use(cors());

app.get("/download", (req, res) => {
  const videoURL = req.query.url;

  if (!videoURL || !videoURL.startsWith("http")) {
    return res.status(400).send("Invalid YouTube URL");
  }

  res.setHeader("Content-Disposition", 'attachment; filename="audio.mp3"');
  res.setHeader("Content-Type", "audio/mpeg");

  // Use the full path to yt-dlp.exe here
  const ytdlp = spawn("C:\\ytdl\\yt-dlp.exe", [
    "-f", "bestaudio",
    "-o", "-",
    videoURL
  ]);

  const ffmpeg = spawn("C:\\ytdl\\ffmpeg.exe", [
    "-i", "pipe:0",
    "-vn",
    "-acodec", "libmp3lame",
    "-ab", "192k",
    "-f", "mp3",
    "pipe:1"
  ]);
  

  ytdlp.stdout.pipe(ffmpeg.stdin);
  ffmpeg.stdout.pipe(res);

  ytdlp.stderr.on("data", (data) => {
    console.error("yt-dlp error:", data.toString());
  });

  ffmpeg.stderr.on("data", (data) => {
    console.error("ffmpeg error:", data.toString());
  });

  ytdlp.on("close", (code) => {
    if (code !== 0) {
      console.error(`yt-dlp exited with code ${code}`);
    }
  });

  ffmpeg.on("close", (code) => {
    if (code !== 0) {
      console.error(`ffmpeg exited with code ${code}`);
      res.status(500).end("Conversion failed.");
    }
  });
});

app.listen(4000, () => {
  console.log("Server running at http://localhost:4000");
});
