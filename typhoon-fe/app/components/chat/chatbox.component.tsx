"use client";

import React, { useState, useEffect, useRef } from "react";
import useStore from "@/stores/statestore";
import { useShallow } from "zustand/shallow";
import styled, { keyframes } from "styled-components";
import { StyledMessage } from "./message.component";
import { createEventSource } from "eventsource-client";
import { useSession } from "next-auth/react";
import axios from "axios";
import { FaPaperPlane, FaRedo } from "react-icons/fa";

export default function Chatbox() {
  const [
    selectedHistoryIdx,
    setSelectedHistoryIdx,
    modelParams,
    modelName,
    messages,
    setMessages,
  ] = useStore(
    useShallow((state) => [
      state.selectedHistoryIdx,
      state.setSelectedHistoryIdx,
      state.modelParams,
      state.modelName,
      state.historyMessages,
      state.setHistoryMessages,
    ])
  );
  const { data: session } = useSession();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const botMessageBuffer = useRef<{
    content: string;
    tokens: number;
    tokenSpeed: number;
  }>({
    content: "",
    tokens: 0,
    tokenSpeed: 0,
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      isbot: false,
      content: inputValue,
      tokens: 0,
      tokenSpeed: 0,
    };

    // register user message
    const result = await axios.post(
      "/api/messages/register",
      {
        email: session?.user?.email || "",
        message: inputValue,
        tokens: 0,
        tokenSpeed: 0,
        role: "user",
        model: modelName,
        session_id: selectedHistoryIdx,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const userMetadata: MessageRegisterResponse = result.data;
    setInputValue("");

    // init request body
    const requestBody = {
      messages: [
        ...messages.map((msg) => ({
          role: msg.isbot ? "bot" : "user",
          content: msg.content,
        })),
        {
          role: "user",
          content: inputValue,
        },
      ],
      model: modelName,
      params: modelParams,
    };

    // init bot message as empty
    const botMessage = {
      isbot: true,
      content: "",
      tokens: 0,
      tokenSpeed: 0,
    };

    botMessageBuffer.current = {
      content: "",
      tokens: 0,
      tokenSpeed: 0,
    };

    setMessages([...messages, userMessage, botMessage]);

    try {
      const es = createEventSource({
        url: "/api/llm/chat",
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
          if (data === "done") {
            break;
          } else {
            const jsonifyData = JSON.parse(data);
            botMessageBuffer.current = {
              content: botMessageBuffer.current.content + jsonifyData.content,
              tokens: jsonifyData.tokens || 0,
              tokenSpeed: jsonifyData.tokenSpeed || 0,
            };

            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: botMessageBuffer.current.content,
                tokens: botMessageBuffer.current.tokens,
                tokenSpeed: Number(
                  botMessageBuffer.current.tokenSpeed?.toFixed(2)
                ),
              };
              return updatedMessages;
            });
          }
        }

        // register bot message
        const botMsgMetadata = await axios.post<MessageRegisterResponse>(
          "/api/messages/register",
          {
            email: session?.user?.email || "",
            message: botMessageBuffer.current.content,
            tokens: botMessageBuffer.current.tokens,
            tokenSpeed: botMessageBuffer.current.tokenSpeed,
            role: "bot",
            model: modelName,
            session_id: userMetadata.session_id,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setMessages((prevMessages) => {
          // Update IDs for bot&user messages
          prevMessages[prevMessages.length - 2] = {
            ...prevMessages[prevMessages.length - 2],
            message_id: userMetadata.message_id,
          };
          prevMessages[prevMessages.length - 1] = {
            ...prevMessages[prevMessages.length - 1],
            message_id: botMsgMetadata.data.message_id,
          };
          return prevMessages;
        });
        setSelectedHistoryIdx(userMetadata.session_id);
      } catch (error) {
        console.error("Error with SSE stream:", error);
      } finally {
        es.close();
        // register bot message
      }
    } catch (error) {
      console.error("Error with SSE stream:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.shiftKey && event.key === "Enter") {
      // Allow Alt + Enter to insert a new line
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const cursorPosition = textarea.selectionStart;

      // Insert a newline at the cursor position
      setInputValue(
        inputValue.slice(0, cursorPosition) +
          "\n" +
          inputValue.slice(cursorPosition)
      );

      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";

      // Move the cursor to the position after the inserted newline
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
      });
    } else if (event.key === "Enter") {
      // Submit the message on Enter
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ChatboxContainer>
      <ChatMessages>
        {messages.map((message, index) => (
          <StyledMessage
            key={`${message.content}-${index}`}
            isbot={message.isbot}
            tokenSpeed={message.tokenSpeed}
            tokens={message.tokens}
            message_id={message.message_id}
            preference={message.preference}
            isLastMsg={index === messages.length - 1}
          >
            {message.content}
          </StyledMessage>
        ))}
        <ResetButton>
          <FaRedo
            onClick={() => {
              setSelectedHistoryIdx();
            }}
          />
        </ResetButton>
        {/* <div ref={messagesEndRef} /> */}
      </ChatMessages>
      <InputContainer>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          onInput={(e) => {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
          }}
        />
        <StyledSendButton onClick={handleSendMessage} />
      </InputContainer>
    </ChatboxContainer>
  );
}

export type MessageRegisterResponse = {
  message: string;
  session_id: number;
  message_id: number;
};

const ChatboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: transparent;
  color: white;
  flex: 3 1 0;
`;

const ChatMessages = styled.div`
  padding: 16px;
  overflow-y: auto;
  height: 80%;
  max-height: 80%;
  background-color: rgb(13, 13, 15);
  border-radius: 20px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 8px;
  background-color: transparent;
  color: white;
  align-items: center;
`;

const Input = styled.textarea`
  padding: 15px;
  flex: 1;
  resize: none;
  height: 80%;
  overflow: hidden;
  background-color: rgb(13, 13, 15);
  color: white;
  border-radius: 40px;
  text-align: left;
`;

type Message = {
  message_id?: number;
  isbot: boolean;
  content: string;
  tokens?: number;
  tokenSpeed?: number;
  preference?: "like" | "dislike" | "na";
};

const hoverGlow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(128, 0, 255, 0.5);
    transform: translateY(0);
  }
  50% {
    box-shadow: 0 0 10px rgba(128, 0, 255, 0.7);
    transform: translateY(-3px);
  }
  100% {
    box-shadow: 0 0 5px rgba(128, 0, 255, 0.5);
    transform: translateY(0);
  }
`;

// Styled Button Component
const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  background-color: #141414;
  color: #ffffff;
  border: 1px solid transparent;
  border-image: linear-gradient(90deg, #a855f7, #ec4899);
  border-image-slice: 1;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  padding: 0 10px 0 10px;
  margin: 0 0 0 10px;
  cursor: pointer;
  height: 70%;
  transition: all 0.3s ease-in-out;

  &:hover {
    animation: ${hoverGlow} 1s infinite ease-in-out;
    background: linear-gradient(90deg, #a855f7, #ec4899);
    color: #fff;
    border: none;
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Button Component
const StyledSendButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <SendButton onClick={onClick}>
      <FaPaperPlane />
      Send
    </SendButton>
  );
};

const ResetButton = styled.button`
  position: sticky;
  top: 95%;
  left: 95%;
  background: transparent;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.3) rotate(45deg);
  }
`;

export type { Message };
