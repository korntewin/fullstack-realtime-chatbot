import { NextResponse } from "next/server";
import { Message } from "@/app/components/chat/chatbox.component";

type MessageSchema = {
  id: number,
  role: "user" | "bot",
  message: string,
  total_tokens: number,
  token_speed: number,
  preference: "like" | "dislike" | "na",
}

export async function GET(
  req: Request,
  context: { params: Promise<{ session_id: number }> }
) {
  const { session_id } = await context.params;
  const apiUrl = `${process.env.LLM_BACKEND_ENDPOINT}/api/chat_sessions/${session_id}/messages/v1`;

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
        { error: error.detail || "Failed to fetch messages." },
        { status: response.status }
      );
    }

    const messages: MessageSchema[] = await response.json();
    const messagesFormatted: Message[] = messages.map((message) => ({
      message_id: message.id,
      isbot: message.role === "bot",
      content: message.message,
      tokens: message.total_tokens,
      tokenSpeed: message.token_speed,
      preference: message.preference,
    }));

    return NextResponse.json(messagesFormatted);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching messages." },
      { status: 500 }
    );
  }
}
