"use client";

import React, { useState , useRef, useEffect, useCallback} from "react";
import Camera, { CameraHandle } from "./components/Camera";


async function convertToSepiaPhoto(photo: string): Promise<string | null> {
  try {
    // Cloudinary
    const cloudinaryResponse = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUri: photo }),
    });

    if (!cloudinaryResponse.ok) {
      console.error("Failed to upload image to Cloudinary:", cloudinaryResponse.status);
      return null;
    }

    const { url } = await cloudinaryResponse.json();
    console.log("Cloudinary URL:", url);

    const sepiaResponse = await fetch("/api/sepia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });

    if (!sepiaResponse.ok) {
      console.error("Failed to convert image to sepia:", sepiaResponse.status);
      return null;
    } 

    const blob = await sepiaResponse.blob();
    const sepiaUrl = URL.createObjectURL(blob);
    console.log("Sepia Photo URL:", sepiaUrl);
    return sepiaUrl;
  } catch (error) {
    console.error("Error in convertToSepiaPhoto:", error);
    return null;
  }
}



export default function Home() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [sepiaPhotos, setSepiaPhotos] = useState<string[]>([]);
  const cameraRef = useRef<CameraHandle>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureTriggeredRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCapturing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCapturing(false);
    setCountdown(0);
  }, []);

  const onCapture = useCallback(
    async (photo: string) => {
      setPhotos((prev) => {
          const update = [...prev, photo];
          if (update.length >= 3) {
            stopCapturing();
          }
          return update;
    });

      const sepiaPhoto = await convertToSepiaPhoto(photo);
      if (sepiaPhoto) {
        setSepiaPhotos((prev) => {
          const updated = [...prev, sepiaPhoto];
          return updated;
        });
      }
    },
    [stopCapturing]
  );

  const startCapturing = useCallback(() => {
    setPhotos([]);
    setSepiaPhotos([]);
    setIsCapturing(true);
    setCountdown(5);
    captureTriggeredRef.current = false;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev == 1) {
          if (!captureTriggeredRef.current && cameraRef.current) {
            captureTriggeredRef.current = true;
            cameraRef.current.capture();
          }
          setTimeout(() => {
            captureTriggeredRef.current = false;
          }, 100);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);


  const handleButtonClick = () => {
    if (isCapturing || photos.length > 0) {
      stopCapturing();
      setPhotos([]);
      setSepiaPhotos([]);
      startCapturing();
    } else {
      startCapturing();
    }
  };

  const handleDownloadPhotos = async () => {
    if (photos.length <= 0) {
      console.log("Need at least 1 photos")
      return
    }
    photos.forEach((photo, index) => {
      const link = document.createElement("a")
      link.href = photo;
      link.download = `photo-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDownloadSepiaPhotos = async () => {
    if (sepiaPhotos.length <= 0) {
      console.log("Need at least 1 photos")
      return
    }
    sepiaPhotos.forEach((photo, index) => {
      const link = document.createElement("a")
      link.href = photo;
      link.download = `photo-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDownloadSepiaPhotoStrip = async () => {
    if (sepiaPhotos.length !== 3) {
      console.log("Need exactly 3 photos to create a photostrip.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = 600; // pad 20px
    canvas.height = 1500; 

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const imageX = 20;
    const imageWidth = 560;
    const imageHeight = 420;
    const verticalPadding = 20;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const images = await Promise.all(sepiaPhotos.map(photo => loadImage(photo)));
      images.forEach((img, index) => {
        const imageY = verticalPadding + index * (imageHeight + verticalPadding);
        ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
      });

      const imagesBottom = verticalPadding + 3 * (imageHeight + verticalPadding) - verticalPadding; // 20 + 3*(420+20) - 20 = 1320
      const remainingSpace = canvas.height - imagesBottom;
  
      ctx.font = "bold 80px georgia";
      ctx.fillStyle = "#000000";
      const text = "Snapify";
      const textMetrics = ctx.measureText(text);
      const textX = (canvas.width - textMetrics.width) / 2;
      const textY = imagesBottom + remainingSpace / 2 + 20;
  
      ctx.fillText(text, textX, textY);
      const dataURL = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "photostrip.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error creating photostrip:", error);
    }
  };

  const handleDownloadPhotoStrip = async () => {
    if (photos.length !== 3) {
      console.log("Need exactly 3 photos to create a photostrip.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = 600; // pad 20px
    canvas.height = 1500; 

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const imageX = 20;
    const imageWidth = 560;
    const imageHeight = 420;
    const verticalPadding = 20;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const images = await Promise.all(photos.map(photo => loadImage(photo)));
      images.forEach((img, index) => {
        const imageY = verticalPadding + index * (imageHeight + verticalPadding);
        ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
      });

      const imagesBottom = verticalPadding + 3 * (imageHeight + verticalPadding) - verticalPadding; // 20 + 3*(420+20) - 20 = 1320
      const remainingSpace = canvas.height - imagesBottom;
  
      ctx.font = "bold 80px georgia";
      ctx.fillStyle = "#000000";
      const text = "Snapify";
      const textMetrics = ctx.measureText(text);
      const textX = (canvas.width - textMetrics.width) / 2;
      const textY = imagesBottom + remainingSpace / 2 + 20;
  
      ctx.fillText(text, textX, textY);
      const dataURL = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "photostrip.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error creating photostrip:", error);
    }
  };
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-5 flex h-screen">
      <main className="flex flex-col col-span-3 p-2 overflow-y-auto items-center bg-white">
        {/* Top header */}
        <div className=" mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-5xl text-black font-bold" >Snapify</h1>
          </div>
        </div>
        <Camera ref={cameraRef} onCapture={onCapture} />
        <div className="grid grid-cols-2 justify-center items-center gap-10">
          <button
            onClick={handleButtonClick}
            className="mt-4 px-4 py-2 border-3 border-black bg-black text-white rounded-3xl shadow-lg hover:bg-gray-300 transition"
          >
            {isCapturing || photos.length === 0 ? "Start Capture" : "Capture Again"}
          </button>
          {isCapturing && (
          <div className="text-5xl font-semibold text-black">
             {countdown}
          </div>
          )}
          </div>
      </main>

      <div className="flex flex-col justify-center items-center">
        <h1 className="text-black font-semibold bg-black"></h1>
        <div className="h-[560px] w-[240px] bg-white flex flex-col p-4 items-center gap-4">
          <div className="h-[150px] w-[200px] bg-gray-100">
            {photos[0] && (
               <img
                src={photos[0]}
                alt="Captured 1"
                className="object-cover shadow"
              />
            )}
          </div>
          <div className="h-[150px] w-[200px] bg-gray-100">
            {photos[1] && (
              <img
                src={photos[1]}
                alt="Captured 2"
                className="object-cover shadow"
              />
            )}
          </div>
          <div className="h-[150px] w-[200px] bg-gray-100">
            {photos[2] && (
              <img
                src={photos[2]}
                alt="Captured 3"
                className="object-cover shadow"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 pt-2">
          <button onClick={handleDownloadPhotos} className="rounded-xl w-[180px] text-xl text-black bg-gray-100 font-semibold shadow hover:bg-gray-800 hover:text-white transition">Get photos</button>
          <button onClick={handleDownloadPhotoStrip} className="rounded-xl   w-[180px] text-xl text-black bg-gray-100 font-semibold shadow hover:bg-gray-800 hover:text-white transition">Get photostrip</button>
        </div>
        <div className="text-xs text-gray-700">
          Snapify
        </div>
      </div>
      <div className="bg-black flex flex-col justify-center items-center">
        <h1 className="text-black font-semibold"></h1>
        <div className="h-[560px] w-[240px] bg-white flex flex-col p-4 items-center gap-4">
          <div className="h-[150px] w-[200px] bg-gray-100">
            {sepiaPhotos[0] && (
               <img
                src={sepiaPhotos[0]}
                alt="Captured 1"
                className="object-cover shadow"
              />
            )}
          </div>
          <div className="h-[150px] w-[200px] bg-gray-100">
            {sepiaPhotos[1] && (
              <img
                src={sepiaPhotos[1]}
                alt="Captured 2"
                className="object-cover shadow"
              />
            )}
          </div>
          <div className="h-[150px] w-[200px] bg-gray-100">
            {sepiaPhotos[2] && (
              <img
                src={sepiaPhotos[2]}
                alt="Captured 3"
                className="object-cover shadow"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 pt-2">
          <button onClick={handleDownloadSepiaPhotos} className="rounded-xl w-[180px] text-xl text-black bg-gray-100 font-semibold shadow hover:bg-gray-800 hover:text-white transition">Get photos</button>
          <button onClick={handleDownloadSepiaPhotoStrip} className="rounded-xl w-[180px] text-xl text-black bg-gray-100 font-semibold shadow hover:bg-gray-800 hover:text-white transition">Get photostrip</button>
        </div>
        <div className="text-xs text-gray-700">
          Snapify
        </div>
      </div>
    </div>
  );
}
