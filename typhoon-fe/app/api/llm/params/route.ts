import axios from "axios";
import { NextResponse } from "next/server";

type LLMSchema = {
  id: number;
  shortname: string;
  fullname: string;
  params: Record<string, any>;  // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function GET() {
  const apiUrl = `${process.env.LLM_BACKEND_ENDPOINT}/api/llm/params/v1`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      const error = response.data;
      return NextResponse.json(
        { error: error.detail || "Failed to fetch LLM parameters." },
        { status: response.status }
      );
    }

    const llms: LLMSchema[] = response.data;

    return NextResponse.json(llms);
  } catch (error) {
    console.error("Error fetching LLM parameters:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching LLM parameters." },
      { status: 500 }
    );
  }
}

export type { LLMSchema };
