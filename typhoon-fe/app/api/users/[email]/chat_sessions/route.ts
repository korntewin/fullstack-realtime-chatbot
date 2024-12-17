import { NextResponse } from "next/server";

type ChatSessionSchema = {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function GET(
  req: Request,
  context: { params: Promise<{ email: string }> }
) {
  const { email } = await context.params;
  const apiUrl = `${process.env.LLM_BACKEND_ENDPOINT}/api/users/${email}/chat_sessions/v1`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || "Failed to fetch chat sessions." },
        { status: response.status }
      );
    }

    const chatSessions: ChatSessionSchema[] = await response.json();

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching chat sessions." },
      { status: 500 }
    );
  }
}
