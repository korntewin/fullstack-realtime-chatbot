import useStore from "@/stores/statestore";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 5%;
  gap: 15px;
  margin-top: 10px;
  margin-bottom: 5px;
  color: white;
`;

const LLMNameContainer = styled.div`
  text-align: center;
  gap: 5px;
  border-radius: 20px;
  color: rgb(116, 112, 112);
  background-color: rgb(13, 12, 12);
  padding: 2px 10px 2px 10px;
`;

export default function LlmName() {
  const { modelName } = useStore();

  return (
    <>
      <Container>
        <h3>Chat</h3>
        <LLMNameContainer>{modelName.shortname}</LLMNameContainer>
      </Container>
    </>
  );
}
