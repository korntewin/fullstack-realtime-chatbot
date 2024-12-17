import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

type RegisterMessageRequest = {
  email: string;
  message: string;
  tokens: number;
  tokenSpeed: number;
  role: "user" | "assistant";
  session_id?: number; // Optional
  message_id?: number;
  model: {
    shortname: string;
    fullname: string;
  };
};

type RegisterMessageResponse = {
  message: string;
  session_id: number;
  message_id: number;
};

export async function POST(req: NextRequest) {
  const apiUrl = `${process.env.LLM_BACKEND_ENDPOINT}/api/messages/register/v1`;

  try {
    const requestBody: RegisterMessageRequest = await req.json();

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      const error = await response.data;
      return NextResponse.json({ error: error }, { status: response.status });
    }

    const responseData: RegisterMessageResponse = response.data;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error registering the message:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while registering the message." },
      { status: 500 }
    );
  }
}

export type { RegisterMessageResponse };
