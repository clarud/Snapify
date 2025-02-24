import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const { dataUri } = await request.json();

  try {
    const base64Data = dataUri.split(",")[1];

    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
      folder: "snapify", 
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}