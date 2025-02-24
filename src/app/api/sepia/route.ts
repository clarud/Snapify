import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const encodedUrl = encodeURI(imageUrl);
    const endpoint = `https://studio.pixelixe.com/api/sepia/v1?imageUrl=${encodedUrl}&imageType=jpg`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${process.env.PIXELIXE_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to convert to sepia:", response.status);
      return NextResponse.json({ error: "Failed to convert image to sepia" }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline; filename=sepia-image.jpg",
      },
    });
  } catch (error) {
    console.error("Error converting to sepia:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
