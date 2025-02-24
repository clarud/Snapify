"use client";

import React, { useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import Webcam from "react-webcam";

export type CameraHandle = {
  capture: () => void;
};

type CameraProps = {
  onCapture: (photo: string) => void;
};


const Camera = forwardRef<CameraHandle, CameraProps>(({ onCapture }, ref) => {
    const webcamRef = useRef<any>(null);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const photo = webcamRef.current.getScreenshot();
            if (photo) {
              onCapture(photo);
            }
        }
    }, [onCapture]);

    useImperativeHandle(ref, () => ({
      capture,
    }));

    return(
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "user" }}
        className="rounded-md shadow-md"
      />
    </div>
    );
});

Camera.displayName = "Camera";
export default Camera;