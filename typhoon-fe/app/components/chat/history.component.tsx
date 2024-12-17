"use client";

import styled from "styled-components";
import { HistoryRecord } from "@/stores/statestore";
import useStore from "@/stores/statestore";
import { useShallow } from "zustand/shallow";

const WrappedHistoryItem = ({
  is_selected,
  children,
  onClick,
}: {
  is_selected: boolean;
  children: string;
  onClick: (id: number) => void;
}) => {
  return (
    <HistoryItem
      background-color={is_selected ? "rgb(207, 87, 226)" : "none"}
      onClick={onClick}
    >
      {children}
    </HistoryItem>
  );
};

export default function UserHistory({
  histories,
}: {
  histories: HistoryRecord[];
}) {
  const { selectedHistoryIdx, setSelectedHistoryIdx } = useStore(useShallow((state) => ({
    selectedHistoryIdx: state.selectedHistoryIdx,
    setSelectedHistoryIdx: state.setSelectedHistoryIdx,
  })));
  const handleClick = (id: number) => {
    setSelectedHistoryIdx(id);
  };

  return (
    <Container>
      <h3>History</h3>
      <HistoryList>
        {histories.map((history) => (
          <WrappedHistoryItem
            key={history.id}
            is_selected={selectedHistoryIdx === history.id ? true : false}
            onClick={() => handleClick(history.id)}
          >
            {history.subject}
          </WrappedHistoryItem>
        ))}
      </HistoryList>
    </Container>
  );
}


const Container = styled.div`
  display: flex;
  padding: 0px 16px 0px 16px;
  flex-direction: column;
  background-color: transparent;
  color: white;
  padding: 16px;
  flex: 1 1 0;
`;

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;

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

const HistoryItem = styled.li<{
  "background-color": string;
  onClick: (id: number) => void;
}>`
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 8px;
  cursor: pointer;
  background-color: ${(props) => props["background-color"]};
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(207, 134, 218);
    transform: scale(1.03);
  }

  &:active {
    background-color: rgb(207, 87, 226);
  }
`;
