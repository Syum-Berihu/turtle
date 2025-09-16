import { useGlobalStore } from "../store";
import { Box, Button, Dialog, IconButton, Input, Portal, Span, Text, useDisclosure } from "@chakra-ui/react";
import { LuBrainCog } from "react-icons/lu";
import { invoke } from "@tauri-apps/api/core";
import { useRef } from "react";

export const AiInput = () => {
  const { open, setOpen } = useDisclosure();
  const value = useGlobalStore((state) => state.aiInput);
  const setValue = useGlobalStore((state) => state.setAiInput);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dummyRef = useRef<HTMLSpanElement>(null);
  const handleClose = ()=>{
    setOpen(false);
    if(buttonRef.current && dummyRef.current){
      buttonRef.current.blur();
      dummyRef.current.focus()
    }
    setValue("")
  }


  return (
    <Dialog.Root placement={"center"} size={"lg"} open={open}>
      <Dialog.Trigger asChild>
        <IconButton size={"xs"} bg={"brand.500"} _hover={{ bg: "brand.600" }} color={"neutral.600"} onClick={()=>setOpen(true)} ref={buttonRef} tabIndex={-1}>
          <LuBrainCog />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop/>
        <Dialog.Positioner onBlur={()=>handleClose()}>
          <Dialog.Content bg={"transparent"}>
            <Dialog.Body
              bg={"rgba(154,160,179,0.3)"}
              borderRadius={"md"}
              borderColor={"neutral.500"}
              borderWidth={"1px"}
              p="1.2rem"
              css={{ backdropFilter: "blur(4px)" }}
            >
              <Box
                color={"neutral.100"}
                textAlign={"center"}
                mb={"1.5rem"}
                lineHeight={1}
                display={"flex"}
                flexDir={"column"}
                alignItems={"center"}
                justifyContent={"center"}
              >
                <Text fontSize={"1.3rem"} color={"neutral.200"} fontWeight={"medium"}>
                  Lets Start!
                </Text>
              </Box>
              <Box>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();

                    await invoke("execute_agent", {
                      instruction: value.trim(),
                    });
                    setValue("")
                    handleClose()
                  }}
                >
                  <Input
                    bg={"neutral.100"}
                    border={"none"}
                    size={"lg"}
                    value={value}
                    placeholder="Enter your prompt"
                    p={".5rem"}
                    onChange={(e) =>{
                      setValue(e.target.value)
                    }}
                  />

                </form>
              </Box>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
