import { createEventSource } from "eventsource-client";
import { NextResponse } from "next/server";

const encoder = new TextEncoder();

export async function GET(request: Request) {
  // Mock endpoint for testing
  try {
    const stream = await mockGetMessage(request);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error handling GET request:", err);
    return NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const requestBody: ChatRequest = await request.json();

    const stream = await streamLLMChat(requestBody);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error handling POST request:", err);
    return NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  model: string;
  params?: Record<string, any>;  // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Streaming function to handle SSE
async function streamLLMChat(requestBody: ChatRequest) {
  const apiUrl = `${process.env.LLM_BACKEND_ENDPOINT}/api/llm/chat/v1`; // Replace with your backend URL
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const es = createEventSource({
          url: apiUrl,
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              method: "POST",
              body: JSON.stringify(requestBody),
              headers: {
                "Content-Type": "application/json",
              },
            }),
        });

        try {
          for await (const { data } of es) {

            if (data != "done") {
              const chunk_data = `data: ${data}\n\n`;
              controller.enqueue(encoder.encode(chunk_data));
            } else {
              controller.enqueue(encoder.encode("data: done\n\n"));
              break;
            }
          }
        } finally {
          es.close();
        }

      } catch (err) {
        console.error("Error streaming LLM chat:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}

async function mockGetMessage(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message") || "No message provided";

  let count = 0;

  const stream = new ReadableStream({
    start(controller) {
      const mock_data = {
        isbot: true,
        content: `hey why you send me this? ${message}`,
        tokens: 2,
        tokenSpeed: 1,
      };
      const msg = JSON.stringify(mock_data);
      controller.enqueue(encoder.encode(`data: ${msg}\n\n`));

      const intervalId = setInterval(() => {
        count++;
        const msg = JSON.stringify({
          ...mock_data,
          tokens: mock_data.tokens + count,
          tokenSpeed: mock_data.tokenSpeed + count,
        });
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        if (count >= 10) {
          controller.enqueue(encoder.encode(`data: ${msg} \n\n`));
          clearInterval(intervalId);
          controller.close();
        }
      }, 100);
    },
  });

  return stream;
}
