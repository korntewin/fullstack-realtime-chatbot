import React from "react";
import styled from "styled-components";
import { createEventSource } from "eventsource-client";
import { FaThumbsDown, FaThumbsUp, FaCopy, FaSync } from "react-icons/fa";
import { useMutation } from "react-query";
import axios from "axios";
import { useState } from "react";
import useStore from "@/stores/statestore";
import { useShallow } from "zustand/shallow";
import { useRef } from "react";
import { MessageRegisterResponse } from "./chatbox.component";
import { useSession } from "next-auth/react";

export const StyledMessage = ({
  isbot,
  children,
  tokens,
  tokenSpeed,
  message_id,
  preference,
  isLastMsg,
}: {
  isbot: boolean;
  children: string;
  tokens?: number;
  tokenSpeed?: number;
  message_id?: number;
  preference?: "like" | "dislike" | "na";
  isLastMsg: boolean;
}) => {
  const [liked, setLiked] = useState(preference === "like");
  const [disliked, setDisLiked] = useState(preference === "dislike");
  const { data: session } = useSession();
  const [
    modelParams,
    modelName,
    messages,
    setMessages,
  ] = useStore(
    useShallow((state) => [
      state.modelParams,
      state.modelName,
      state.historyMessages,
      state.setHistoryMessages,
    ])
  );
  const botMessageBuffer = useRef<{
    content: string;
    tokens: number;
    tokenSpeed: number;
  }>({
    content: "",
    tokens: 0,
    tokenSpeed: 0,
  });
  const { mutate: registerPreference } = useMutation(
    async (preference: string) => {
      if (!message_id) {
        throw new Error("Message ID is required.");
      }

      const response = await axios.patch("/api/messages/preference", {
        message_id: message_id,
        preference: preference,
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        console.log("Preference submitted:", data);
      },
      onError: (error) => {
        console.error("Preference submission failed:", error);
      },
    }
  );
  const onLike = () => {
    setLiked(true);
    setDisLiked(false);
    registerPreference("like");
  };
  const onDislike = () => {
    setLiked(false);
    setDisLiked(true);
    registerPreference("dislike");
  };
  const onCopy = () => {
    console.log("Copied");
  };
  const onRegenerate = async () => {
    const requestBody = {
      messages: [
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.isbot ? "bot" : "user",
          content: msg.content,
        })),
        {
          role: "user",
          content: messages[messages.length - 2].content,
        },
      ],
      model: modelName,
      params: modelParams,
    };

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
        await axios.post<MessageRegisterResponse>(
          "/api/messages/register",
          {
            email: session?.user?.email || "",
            message: botMessageBuffer.current.content,
            tokens: botMessageBuffer.current.tokens,
            tokenSpeed: botMessageBuffer.current.tokenSpeed,
            role: "bot",
            model: modelName,
            message_id: messages[messages.length - 1].message_id,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
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

  return (
    <MessageContainer align-self={isbot ? "flex-start" : "flex-end"}>
      <MessageContent
        background-color={isbot ? "none" : "rgb(36, 36, 42)"}
        width={isbot ? "100%" : "auto"}
      >
        {children}
        {isbot && (
          <CopyButtonWrapper>
            <CopyButton onClick={onCopy}>
              <FaCopy />
            </CopyButton>
          </CopyButtonWrapper>
        )}
      </MessageContent>
      {isbot && (
        <>
          <ActionButtons>
            <WrappedActionButton
              onClick={onLike}
              active={liked}
              isLikeButton={true}
            >
              <FaThumbsUp />
            </WrappedActionButton>
            <WrappedActionButton
              onClick={onDislike}
              active={disliked}
              isLikeButton={false}
            >
              <FaThumbsDown />
            </WrappedActionButton>
            {isLastMsg && (
              <WrappedRegenerateButton>
                <FaSync onClick={onRegenerate} />
              </WrappedRegenerateButton>
            )}
            <InfoText>
              {tokens} tokens | {tokenSpeed} tokens/s
            </InfoText>
          </ActionButtons>
        </>
      )}
    </MessageContainer>
  );
};

export const MessageContainer = styled.div<{
  "align-self": string;
}>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) =>
    props["align-self"] === "flex-start" ? "flex-start" : "flex-end"};
  margin: 8px 0;
`;

const WrappedActionButton = ({
  active,
  isLikeButton,
  children,
  onClick,
}: {
  active: boolean;
  isLikeButton: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => {
  const color = isLikeButton ? "green" : "red";
  const baseColor = "rgb(74, 74, 79)";
  return (
    <ActionButton
      onClick={onClick}
      color={active ? color : baseColor}
      hoverColor={color}
    >
      {children}
    </ActionButton>
  );
};

const MessageContent = styled.div<{
  "background-color": string;
  width: string;
}>`
  margin: 5px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-radius: 40px;
  background-color: ${(props) => props["background-color"]};
  max-width: 100%;
  word-wrap: break-word;
  position: relative;
  text-align: justify;
  white-space: pre-wrap;
  width: ${(props) => props.width};
`;

const WrappedRegenerateButton = styled.div`
  transition: transform 0.5s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.1) rotate(45deg);
  }
`;

const CopyButtonWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 15px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const InfoText = styled.div`
  font-size: 12px;
  color: #777;
`;

const ActionButton = styled.button<{ color: string; hoverColor: string }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  color: ${(props) => props.color};

  &:hover {
    color: ${(props) => props.hoverColor};
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: rgb(74, 74, 79);
  justify-content: flex-end;
  position: absolute;
  top: 20%;
  right: 0%;

  &:hover {
    color: #007bff;
  }
`;
