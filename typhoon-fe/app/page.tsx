"use client";

import Chatbox from "./components/chat/chatbox.component";
import ParameterAdjustment from "./components/chat/params.component";
import styled from "styled-components";
import UserHistory from "./components/chat/history.component";
import { useSession } from "next-auth/react";
import { useMutation } from "react-query";
import axios from "axios";
import { useEffect } from "react";
import useStore from "@/stores/statestore";
import { useQuery } from "react-query";
import { HistoryRecord } from "@/stores/statestore";
import { Message } from "./components/chat/chatbox.component";
import LlmName from "./components/chat/llmname.component";

export default function Home() {
  const { data: session } = useSession();
  const { selectedHistoryIdx, setHistoryMessages } = useStore();

  const { mutate: registerEmail, isLoading } = useMutation(
    async (email: string) => {
      const response = await axios.post("/api/users/register", { email });
      return response.data;
    },
    {
      onSuccess: (data) => {  // eslint-disable-line @typescript-eslint/no-unused-vars
        console.log("Registration successful");
      },
      onError: (error) => {
        console.error("Registration failed:", error);
      },
    }
  );
  // Query chat sessions
  const { data: chatSessions = [] } = useQuery(
    ["chatSessions", session?.user?.email, selectedHistoryIdx],
    async () => {
      if (!session?.user?.email) return [];
      const response = await axios.get<HistoryRecord[]>(
        `/api/users/${session.user.email}/chat_sessions`
      );
      return response.data.reverse();
    },
    {
      enabled: !!session?.user?.email,
    }
  );

  // Query messages for selected history
  useQuery(["messages", selectedHistoryIdx], async () => {
    if (!selectedHistoryIdx) {
      setHistoryMessages([]);
      return [];
    }
    const response = await axios.get<Message[]>(
      `/api/chatsessions/${selectedHistoryIdx}/messages`
    );
    const messages = response.data?.sort(
      (a, b) => (a.message_id || 0) - (b.message_id || 1)
    );
    setHistoryMessages(messages);
    return messages;
  });

  useEffect(() => {
    if (session?.user?.email) {
      registerEmail(session.user.email);
    }
  }, [session?.user?.email]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!isLoading ? (
        <MainContainer>
          <ChatBoxWithHistoryAndParamsContainer>
            <UserHistory histories={chatSessions ? chatSessions : []} />
            <ChatBoxWithNameContainer>
              <LlmName />
              <ChatBoxWithParamsContainer>
                <Chatbox />
                <ParameterAdjustment />
              </ChatBoxWithParamsContainer>
            </ChatBoxWithNameContainer>
          </ChatBoxWithHistoryAndParamsContainer>
        </MainContainer>
      ) : (
        <MainContainer>
          <h1>Registering your email please wait...</h1>
        </MainContainer>
      )}
    </>
  );
}

const MainContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: row;
  font-family: "Arial", sans-serif;
`;

const ChatBoxWithHistoryAndParamsContainer = styled.div`
  width: 80%;
  height: 80%;
  margin-top: 1%;
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  background-color: rgb(27, 27, 31);
  gap: 10px;
`;

const ChatBoxWithParamsContainer = styled.div`
  display: flex;
  height: 100%;
  gap: 10px;
`;

const ChatBoxWithNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 3 1 0;
`;
