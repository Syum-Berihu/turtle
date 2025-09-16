import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { Box, Button, Flex, Grid, GridItem } from "@chakra-ui/react";
import { useParseAnsi } from "./hooks";
import { useGlobalStore } from "./store";
import { Nav } from "./layouts/nav/Nav";
import { TerminalComponent } from "./pages";

function App() {
  const createTab = useGlobalStore((state) => state.createTab);
  const tabs = useGlobalStore((state) => state.tabs);
  const activeTab = useGlobalStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId);
    return tab ? tab : null;
  });

  const activeTabId = useGlobalStore((state) => state.activeTabId);
  const setWriteTab = useGlobalStore((state) => state.setWriteTab);
  const value = useGlobalStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId);
    return tab ? tab.inputValue : "";
  });
  const addCommands = useGlobalStore((state) => state.addCommand);

  const { textToHtml, parseAnsiEscapes } = useParseAnsi();

  useEffect(() => {
    const unlisten = listen<string>("shell-output", (event) => {
      addCommands(
        textToHtml(parseAnsiEscapes(event.payload)),
        activeTab?.id as string,
      );
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        await invoke("send_ctrl_c");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAction = async (command: string) => {
    console.log("Shell Output:", activeTabId);
    setWriteTab();
    await invoke("write_shell", { input: command });
  };

  const handleAiAction = async () => {
    // console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", value);
    await invoke("execute_agent", { instruction: value.trim() });
  };

  useEffect(() => {
    createTab();
    const init = async () => {
      await invoke("init");
    };
    init();
  }, []);

  return (
    <Box
      bg={"neutral.900"}
      color={"neutral.200"}
      fontSize={"1rem"}
      lineHeight={"1rem"}
      display={"flex"}
      flexDir={"column"}
      h={"100vh"}
      w={"100vw"}
    >
      <Grid
        h={"100%"}
        templateRows="repeat(24, 1fr)"
        p={"0.25rem"}
        gap={"0.5rem"}
        width={"100%"}
      >
        <GridItem rowSpan={1} minW={"100%"}>
          <Nav />
        </GridItem>
        <GridItem rowSpan={23} width={"100%"} maxW={"100%"}>
          {/* <Button onClick={() => handleAiAction()}>Test</Button> */}
          {activeTab && <TerminalComponent handleAction={handleAction} />}
        </GridItem>
      </Grid>
    </Box>
  );
}

export default App;
