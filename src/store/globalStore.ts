import { Terminal } from "../types";
import { generateId, generateName } from "../utils";
import { create } from "zustand";

type GlobalStore = {
  tabs: Terminal[];
  aiInput: string;
  ai: boolean;
  systemBanner: string;
  activeTabId: string | null;
  writeTabId: string | null;
  createTab: () => void;
  addCommand: (command: string,activeTabId:string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string | null) => void;
  setTabInputValue: (value: string) => void;
  eraseTab: () => void;
  setAiMode: () => void;
  setAiInput: (value: string) => void;
  setWriteTab:()=>void
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  tabs: [],
  ai: false,
  aiInput: "",
  systemBanner: ">",
  activeTabId: null,
  writeTabId:null,
  createTab: () =>
    set((state) => {
      const id = generateId();
      if (state.tabs.length > 12) {
        return { ...state };
      }
      return {
        ...state,
        activeTabId: id,
        writeTabId:id,
        tabs: [
          ...state.tabs,
          {
            id: id,
            name: generateName(),
            content: [],
            inputValue: " ".repeat(state.systemBanner.length),
          },
        ],
      };
    }),
  closeTab: (id: string) =>
    set((state) => {
      const index = state.tabs.findIndex((item) => item.id === id);
      let newIdx = index;
      const newTabs = state.tabs.filter((tab) => tab.id !== id);
      if (index == state.tabs.length - 1) {
        newIdx = index - 1;
      }
      return {
        ...state,
        tabs: newTabs,
        activeTabId: newTabs[newIdx].id,
        writeTabId:newTabs[newIdx].id
      };
    }),
  setActiveTab: (id: string | null) =>
    set((state) => {
      return { ...state, activeTabId: id };
    }),
  setWriteTab:()=>{
    set((state)=>{
      return{...state,writeTabId:state.activeTabId}
    })
  },
  addCommand: (result: string) =>
    set((state) => {
      const index = state.tabs.findIndex(
        (item) => item.id === state.writeTabId,
      );
      console.log("im here",index,state.writeTabId)
      let newTabs = [...state.tabs];
      if (
        state.tabs[index].inputValue.trim() === "" &&
        state.tabs[index].content.length > 0
      ) {
        newTabs[index].content[newTabs[index].content.length - 1].result +=
          result;
        return { ...state, tabs: newTabs };
      }
      newTabs[index].content = [
        ...newTabs[index].content,
        { name: newTabs[index].inputValue, result: result },
      ];
      newTabs[index].inputValue = " ".repeat(state.systemBanner.length);
      return { ...state, tabs: newTabs };
    }),
  setTabInputValue: (value: string) =>
    set((state) => {
      const index = state.tabs.findIndex(
        (item) => item.id === state.activeTabId,
      );
      let newTabs = [...state.tabs];
      newTabs[index].inputValue = value;
      return { ...state, tabs: newTabs };
    }),
  eraseTab: () =>
    set((state) => {
      const index = state.tabs.findIndex(
        (item) => item.id === state.activeTabId,
      );
      let newTabs = [...state.tabs];
      newTabs[index].content = [];
      return { ...state, tabs: newTabs };
    }),
  setAiMode: () =>
    set((state) => {
      return { ...state, ai: !state.ai };
    }),
  setAiInput: (value: string) =>
    set((state) => {
      return { ...state, aiInput: value };
    }),
}));
