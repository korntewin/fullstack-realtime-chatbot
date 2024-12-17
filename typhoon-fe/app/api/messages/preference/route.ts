import axios from "axios";
import { NextResponse } from "next/server";

type PreferenceEnum = "like" | "dislike" | "na";

type PreferenceRequest = {
  message_id: number;
  preference: PreferenceEnum;
};

export async function PATCH(req: Request) {
  const body = (await req.json()) as PreferenceRequest;

  const apiUrl = `${process.env.LLM_BACKEND_ENDPOINT}/api/messages/preference/v1`;
  const res = await axios.patch(apiUrl, body, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200) {
    return NextResponse.json(
      { error: "Failed to update message preference." },
      { status: res.status }
    );
  }
  return NextResponse.json({ success: true });
}
