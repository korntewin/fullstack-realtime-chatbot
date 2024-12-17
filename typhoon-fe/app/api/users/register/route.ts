import axios from 'axios';
import { NextResponse } from 'next/server';

type RegisterUserRequest = {
  email: string;
}

type RegisterUserResponse = {
  message: string;
  user_id: number;
  email: string;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request body
    const body: RegisterUserRequest = await request.json();

    // Make request to FastAPI backend
    const response = await axios.post<RegisterUserResponse>(
      `${process.env.LLM_BACKEND_ENDPOINT}/api/users/register/v1`,
      body
    );

    // Return the response from FastAPI
    return NextResponse.json(response.data);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.detail || 'Registration failed' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
