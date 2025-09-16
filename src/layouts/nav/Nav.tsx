import { AiInput } from "../../pages";
import { useGlobalStore } from "../../store";
import { Box, IconButton, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { MdAdd, MdClose } from "react-icons/md";

export const Nav = () => {
  const tabs = useGlobalStore((state) => state.tabs);
  const createTab = useGlobalStore((state) => state.createTab);
  const closeTab = useGlobalStore((state) => state.closeTab);
  const activeTab = useGlobalStore((state) => state.activeTabId);
  const setActiveTab = useGlobalStore((state) => state.setActiveTab);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("coming from tavs", activeTab);
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if(!scrollRef.current) return
    scrollRef.current.scrollLeft += e.deltaY;
  }

  return (
    <Box display={"flex"} maxWidth={"100%"} flexShrink={0} userSelect={"none"} gap={"0.25rem"}>
      <Box
        bg={"neutral.700"}
        borderRadius={"md"}
        display={"flex"}
        p={"0.25rem"}
        flexGrow={1}
        minW={0}
      >
        <Box
          width={"100%"}
          display={"flex"}
          onWheel={(e)=>handleWheel(e)}
          overflowX={"auto"}
          ref={scrollRef}
          borderRadius={"md"}
          gap={"0.5rem"}
          minW={0}
          css={{
            scrollbarWidth:"none"
          }}
        >
          {tabs.map((item, idx) => (
            <Tab
              title={item.name}
              id={item.id}
              key={idx}
              closeTab={closeTab}
              active={activeTab === item.id}
              setActiveTab={setActiveTab}
              removable={tabs.length > 1}
            />
          ))}
        </Box>
      </Box>
      <Box
        display={"flex"}
        bg={"neutral.700"}
        p={"0.25rem"}
        borderRadius={"md"}
        flexShrink={0}
        gap={"0.25rem"}
      >
        <IconButton
          variant={"outline"}
          color={"brand.500"}
          borderColor={"brand.500"}
          _hover={{bg:"brand.600", color:"neutral.900", borderColor:"brand.600"}}
          size={"xs"}
          onClick={() => {
            createTab();
          }}
        >
          <MdAdd />
        </IconButton>
        <AiInput/>
      </Box>
    </Box>
  );
};

type TabProps = {
  title: string;
  id: string;
  closeTab: (id: string) => void;
  active: boolean;
  setActiveTab: (id: string | null) => void;
  removable: boolean;
};

const Tab: React.FC<TabProps> = ({
  title,
  id,
  closeTab,
  active,
  setActiveTab,
  removable,
}) => {
  return (
    <Box
      bg={active ? "brand.500" : "neutral.800"}
      _hover={{bg: active ? "brand.400" : "neutral.900",cursor:"pointer"}}
      color={active? "neutral.700":"brand.500"}
      fontWeight={"bold"}
      whiteSpace={"nowrap"}
      width={"100%"}
      minW={"10rem"}
      borderRadius={"sm"}
      display={"flex"}
      justifyContent={"space-between"}
      pos={"relative"}
    >
      <Box
        w={"100%"}
        m={0}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        onClick={() => setActiveTab(id)}
      >
        <Text
          width={"70%"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          overflowX={"clip"}
        >
          {title}
        </Text>
      </Box>
      <Box
        display={"flex"}
        alignItems={"center"}
        position={"absolute"}
        left={"calc(100% - 2ch)"}
        top={"25%"}
      >
        <Box
          display={removable ? "flex" : "none"}
          onClick={() => closeTab(id)}
          _hover={{ bg: active ? "neutral.700" : "neutral.500", color: "brand.500" }}
          borderRadius={"0.25rem"}
          height={"fit-content"}
        >
          <MdClose />
        </Box>
      </Box>
    </Box>
  );
};
