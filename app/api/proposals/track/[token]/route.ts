import dbConnect from "@/lib/db";
import Proposal from "@/lib/models/Proposal";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// Public: email open tracking pixel. Marks the proposal as opened.
export async function GET(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { token } = await params;
    const proposal = await Proposal.findOne({ token });
    if (proposal && !proposal.openedAt) {
      proposal.openedAt = new Date();
      await proposal.save();
    }
  } catch {
    // Never let tracking failures break the pixel response.
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    },
  });
}
