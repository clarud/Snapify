declare module "react-webcam" {
    import * as React from "react";
  
    export interface ReactWebcamProps {
      audio?: boolean;
      height?: number | string;
      width?: number | string;
      screenshotFormat?: string;
      videoConstraints?: MediaTrackConstraints;
      className?: string;
      style?: React.CSSProperties;
    }
  
    export default class ReactWebcam extends React.Component<ReactWebcamProps> {}
  }
  