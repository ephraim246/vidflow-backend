   const express =  require("express")
const youtubedl = require('youtube-dl-exec');
const cors = require("cors");
const crypto = require("crypto");

const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors({
  origin: "https://vidflow-sable-seven.vercel.app"
}));

app.use(express.json());
// Create a folder for downloaded videos
const downloadFolder = path.join(__dirname, "downloads");

fs.mkdirSync(downloadFolder, { recursive: true });

// Your existing route

app.post("/download", async function (req, res) {

  const url = req.body.url;

  if (typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      message: "Please provide a Facebook video URL."
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid URL."
    });
  }

  const allowedHosts = [
    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "web.facebook.com",
    "fb.watch"
  ];

  if (
    parsedUrl.protocol !== "https:" ||
    !allowedHosts.includes(parsedUrl.hostname.toLowerCase()) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.port
  ) {
    return res.status(400).json({
      message: "Please provide a valid HTTPS Facebook video URL."
    });
  }

 
const jobFolder = path.join(
  downloadFolder,
  "video-" + crypto.randomUUID()
);
  try {
    await fs.promises.mkdir(jobFolder, { recursive: true });

    await youtubedl(url, {
      output: path.join(jobFolder, "video.%(ext)s"),
      format: "best",
      noPlaylist: true
    });

    const files = await fs.promises.readdir(jobFolder);

    
const videoFile = files.find(function (file) {
  return (
    file.startsWith("video.") &&
   /\.(mp4|webm|mov|mkv)$/i.test(file) &&
    !file.endsWith(".part") &&
    !file.endsWith(".ytdl")
  );
});
    if (!videoFile) {
      throw new Error("The video file was not created.");
    }

        const videoPath = path.join(jobFolder, videoFile);
   const downloadName =
      "facebook-video-" +
      crypto.randomUUID() +
      path.extname(videoFile);

    // Send the video to the user's browser
    res.download( videoPath , downloadName, async function (error) {

      await fs.promises.rm(jobFolder, {
        recursive: true,
        force: true
      }).catch(function () {});

      if (error && !res.headersSent) {
        res.status(500).json({
          message: "Unable to send the video file."
        });
      }
    });

  } catch (error) {
    await fs.promises.rm(jobFolder, {
      recursive: true,
      force: true
    }).catch(function () {});

    console.error("Video download error:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Unable to download this video. It may be private or unavailable."
      });
    }
  }

});


app.listen(3000, function () {
    console.log("server has started on port 3000");
});
