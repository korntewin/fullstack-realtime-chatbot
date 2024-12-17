"use client";

import { create, StateCreator } from "zustand";
import { Message } from "@/app/components/chat/chatbox.component";

// Model params store
type ModelParams = {
  outputLength: number;
  temperature: number;
  topK: number;
  topP: number;
  repetitionPenalty: number;
};

type ModelStore = {
  modelParams: ModelParams;
  modelName: {
    shortname: string;
    fullname: string;
  };
  setModelParams: (model: ModelParams) => void;
  setModelName: ({
    shortname,
    fullname,
  }: {
    shortname: string;
    fullname: string;
  }) => void;
};

const createParamsStore: StateCreator<ModelStore> = (set) => ({
  modelParams: {
    outputLength: 256,
    temperature: 1,
    topK: 40,
    topP: 1,
    repetitionPenalty: 1,
  },
  modelName: {
    shortname: "",
    fullname: "",
  },
  setModelParams: (modelParams: ModelParams) => set({ modelParams }),
  setModelName: ({
    shortname,
    fullname,
  }: {
    shortname: string;
    fullname: string;
  }) => set({ modelName: { shortname, fullname } }),
});

// Chat history store
type HistoryRecord = {
  id: number;
  subject: string;
};

type HistoryStore = {
  selectedHistoryIdx?: Number;
  setSelectedHistoryIdx: (idx?: Number) => void;
  historyMessages: Message[];
  setHistoryMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
};

const createHistoryStore: StateCreator<HistoryStore> = (set) => ({
  selectedHistoryIdx: undefined,
  setSelectedHistoryIdx: (selectedHistoryIdx?: Number) =>
    set({ selectedHistoryIdx }),
  newSession: () => set({ selectedHistoryIdx: undefined }),
  historyMessages: [],
  setHistoryMessages: (updater) =>
    set((state) => ({
      historyMessages:
        typeof updater === 'function' ? updater(state.historyMessages) : updater,
    })),
});

// Combined store state

type StoreState = ModelStore & HistoryStore;

const useStore = create<StoreState>((...a) => ({
  ...createParamsStore(...a),
  ...createHistoryStore(...a),
}));

export type { ModelParams, HistoryRecord };
export default useStore;
