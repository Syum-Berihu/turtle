import React, { useEffect, useRef } from "react";
import { Box, Span, Text } from "@chakra-ui/react";
import { Editor } from "../features";
import { useGlobalStore } from "../store";

type TerminalProps = {
  handleAction: (command: string) => void;
};

export const TerminalComponent: React.FC<TerminalProps> = ({
  handleAction,
}) => {
  const activeTab = useGlobalStore((state) => state.activeTabId);
  const tab = useGlobalStore((state) => state.tabs);
  const activeTabContent = useGlobalStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId);
    return tab ? tab : null;
  });
  const systemBanner = useGlobalStore((state) => state.systemBanner);
  const textRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    console.log("handling focus");
    if (textRef.current) {
      textRef.current.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tab]);
  useEffect(() => {
    handleFocus();
  }, [activeTab]);
  return (
    <Box
      display={"flex"}
      bg={"neutral.800"}
      borderRadius={"md"}
      onClick={() => handleFocus()}
      overflowY={"auto"}
      contain={"content"}
      ref={scrollRef}
      height={"100%"}
      maxW={"100%"}
    >
      <Box width={"100%"} maxW={"100%"} >
        {activeTabContent &&
          activeTabContent.content.map((command, idx) => (
            <Box key={idx} mt={"8px"}>
              <Box>
                <Span color={"support.green"} fontWeight={"bold"}>{systemBanner}</Span>
                <Span wordBreak={"break-all"}>{command.name}</Span>
              </Box>
              <Box mt={"4px"}>
                <Text
                  whiteSpace={"pre-wrap"}
                  wordBreak={"break-all"}
                  fontFamily={"monospace"}
                  dangerouslySetInnerHTML={{ __html: command.result }}
                ></Text>
              </Box>
            </Box>
          ))}
        <Box maxW={"100%"}>
          <Editor handleAction={handleAction} ref={textRef} />
        </Box>
      </Box>
    </Box>
  );
};
