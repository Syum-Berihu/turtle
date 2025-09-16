import { useGlobalStore } from "../../store";
import { pxToCh } from "../../utils";
import { Box, Input, Text } from "@chakra-ui/react";
import React, {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type TerminalProps = {
  // characterWidth: number;
  handleAction: (command: string) => void;
};

export const Editor = forwardRef<HTMLInputElement, TerminalProps>(
  ({ handleAction }, textRef) => {
    const value = useGlobalStore((state) => {
      const tab = state.tabs.find((item) => item.id === state.activeTabId);
      return tab ? tab.inputValue : "";
    });
    const setValue = useGlobalStore((state) => state.setTabInputValue);
    const systemInfoBanner = useGlobalStore((state) => state.systemBanner);

    const eraseTab = useGlobalStore((state)=>state.eraseTab)

    // const [value, setValue] = useState(" ".repeat(systemInfoBanner.length));
    const [characterWidth, setCharacterWidth] = useState(20);
    const [lines, setLines] = useState<string[]>([""]);
    const [cursorOffset, setCursorOffset] = useState<number[]>([0, 0]);
    const [cursorPositionY, setCursorPositionY] = useState(0);
    const [blink, setBlink] = useState(true);
    const cursorRef = useRef<any>(null);
    const sizeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tabs = useGlobalStore((state) => state.tabs);
    const activeTab = useGlobalStore((state) => {
      const tab = state.tabs.find((item) => item.id === state.activeTabId);
      return tab ? tab : null;
    });
    const inputValue = useGlobalStore((state) => {
      const val = state.tabs.find(
        (item) => item.id === state.activeTabId,
      )?.inputValue;
      return val ? val : "";
    });

    const handleCursorPosition = (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      let offset =
        target.value.length -
        (cursorOffset[1] * characterWidth - cursorOffset[0]);

      if (offset === 0) {
        return;
      }
      setCursorPositionY(Math.floor(offset / characterWidth));
    };

    const blinker = () => {
      setBlink(false);
      if (cursorRef.current) {
        clearTimeout(cursorRef.current);
      }
      cursorRef.current = setTimeout(() => {
        setBlink(true);
      }, 1000);
    };

    const delayedResize = () => {
      if (sizeRef.current) {
        clearTimeout(sizeRef.current);
      }
      sizeRef.current = setTimeout(() => {
        if (!containerRef.current) return;
        setCharacterWidth(Math.floor(pxToCh(containerRef.current.offsetWidth)));
        recalculateChunks(Math.floor(pxToCh(containerRef.current.offsetWidth)));
        sizeRef.current = null;
      }, 50);
    };
    const recalculateChunks = (width: number) => {
      const regExp = new RegExp(`.{1,${width}}`, "g");
      const chunks = activeTab?.inputValue.match(regExp);
      setLines((chunks as string[]) || []);

      setCursorPositionY(chunks ? chunks.length - 1 : 0);
      setCursorOffset([0, 0]);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      blinker();
      const allowedKeys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Backspace",
        "Enter",
      ];
      const target = e.target as HTMLInputElement;
      if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        e.preventDefault();
        return;
      }
      if (!allowedKeys.includes(e.code)) {
        return;
      }
      const lengthOfLastLine = lines[lines.length - 1]
        ? lines[lines.length - 1].length
        : 0;
      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          //stop cursor at the systemInfo
          if (
            target.value.length -
              cursorOffset[1] * characterWidth +
              cursorOffset[0] <=
            systemInfoBanner.length
          ) {
            console.log(
              "left: stopping cursor at banner",
              target.value.length -
                cursorOffset[1] * characterWidth +
                cursorOffset[0],
            );
            break;
          }

          //wrapping
          if (
            lengthOfLastLine + cursorOffset[0] <= 0 &&
            lines.length - cursorOffset[1] > 1
          ) {
            setCursorOffset((prev) => [
              characterWidth - lengthOfLastLine - 1,
              Math.min(prev[1] + 1, lines.length - 1),
            ]);
            break;
          }
          //left movement
          else {
            setCursorOffset((prev) => [
              Math.max(prev[0] - 1, 0 - lengthOfLastLine),
              prev[1],
            ]);
          }
          break;
        case "ArrowRight":
          e.preventDefault();

          //stop the cursor when it hits the end
          if (cursorOffset[0] == 0 && cursorOffset[1] == 0) {
            break;
          }

          //cursor wrap
          if (lengthOfLastLine + cursorOffset[0] >= characterWidth - 1) {
            setCursorOffset((prev) => [
              0 - lengthOfLastLine,
              Math.max(prev[1] - 1, 0),
            ]);
            break;
          }
          //move cursor to the right
          else {
            setCursorOffset((prev) => [prev[0] + 1, prev[1]]);
          }
          break;
        case "ArrowUp":
          e.preventDefault();

          if (cursorOffset[1] >= lines.length - 1) {
            break;
          }

          //return cursor to the first position
          if (
            lines.length - 1 - cursorOffset[1] == 1 &&
            lengthOfLastLine + cursorOffset[0] <= systemInfoBanner.length
          ) {
            setCursorOffset((prev) => [
              systemInfoBanner.length - lengthOfLastLine,
              Math.min(prev[1] + 1, lines.length - 1), //from cursorPositionY
            ]);
            break;
          } else {
            setCursorOffset((prev) => [
              prev[0],
              Math.min(prev[1] + 1, lines.length - 1), //from cursorPositionY
            ]);
            break;
          }
        case "ArrowDown":
          e.preventDefault();

          //stop downward movement
          if (cursorOffset[1] == 0) {
            break;
          }

          //return cursor to end of line
          if (cursorOffset[1] == 1 && cursorOffset[0] > 0) {
            setCursorOffset((prev) => [0, Math.max(prev[1] - 1, 0)]);
            break;
          }

          //downward movement
          else {
            setCursorOffset((prev) => [prev[0], Math.max(prev[1] - 1, 0)]);
            break;
          }
        case "Backspace":
          if (
            target.value.length +
              cursorOffset[0] -
              systemInfoBanner.length -
              cursorOffset[1] * characterWidth <=
            0
          ) {
            e.preventDefault();
          }
          break;

        case "Enter":
          e.preventDefault();

          if(value.trimStart() == "clear"){
           eraseTab()
           return
          }
          handleAction(value.trimStart() + "\n");

          break;

        default:
          break;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const lengthOfLastLine = lines[lines.length - 1]
        ? lines[lines.length - 1].length
        : 0;
      if (
        lines.length - 1 - cursorOffset[1] == 0 &&
        lengthOfLastLine - cursorOffset[0] + systemInfoBanner.length <
          systemInfoBanner.length
      ) {
        setCursorOffset(() => [0, 0]);
      } else {
        blinker();
        const regExp = new RegExp(`.{1,${characterWidth}}`, "g");
        const chunks = e.target.value.match(regExp);
        setValue(e.target.value);
        setLines((chunks as string[]) || []);
      }
    };

    const handleFocus = () => {
      blinker()
      if (textRef && typeof textRef !== "function" && textRef.current) {
        setBlink(true);
        textRef.current?.focus();
      }
    };

    useLayoutEffect(() => {
      //recalculate the display vertical offset
      let offset =
        value.length - (cursorOffset[1] * characterWidth - cursorOffset[0]);

      if (offset === 0) {
        return;
      }
      setCursorPositionY(Math.floor(offset / characterWidth));

      //set the actual cursor inside the input in the apropriate position
      let caretPosition =
        value.length - (cursorOffset[1] * characterWidth - cursorOffset[0]);

      if (textRef && typeof textRef !== "function" && textRef.current) {
        textRef.current.focus();
        textRef.current?.setSelectionRange(caretPosition, caretPosition);
      }
    }, [cursorOffset[0], cursorOffset[1]]);

    // useEffect(() => {
    //   if (containerRef.current) {
    //     setCharacterWidth(Math.floor(pxToCh(containerRef.current.offsetWidth)));
    //   }
    // }, []);

    useEffect(() => {
      console.log("tabs changed")
      const regExp = new RegExp(`.{1,${characterWidth}}`, "g");
      const chunks = inputValue.match(regExp);
      setLines((chunks as string[]) || []);
    }, [tabs,activeTab]);

    useEffect(() => {
      if (!containerRef.current) return;
      // setCharacterWidth(Math.floor(pxToCh(containerRef.current.offsetWidth)));
      const resizeObserver = new ResizeObserver((entries) => {
        console.log(entries)
        delayedResize();
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
        if (sizeRef.current) clearTimeout(sizeRef.current);
      };
    }, []);

    return (
      <Box ref={containerRef} h={"100%"}>
        <Box
          pos={"relative"}
          color={"white"}
          onClick={() => handleFocus()}
          // w={`${characterWidth}ch`}
          fontSize={"1rem"}
          overflow={"hidden"}
        >
          <Text
            lineHeight={"1.5rem"}
            whiteSpace={"break-spaces"}
            pos={"relative"}
          >
            <Box as={"span"} pos={"absolute"} color={"support.green"}>
              {systemInfoBanner}
            </Box>
            {lines.map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </Text>
          <Box
            animationName={blink ? "fade-in" : ""}
            animationDuration="1s"
            animationIterationCount="infinite"
            top={`${cursorPositionY * 1.5}rem`}
            left={`${(value.length + cursorOffset[0]) % characterWidth}ch`}
            pos={"absolute"}
            bg={"white"}
            height={"1.5rem"}
            w={"1ch"}
            mixBlendMode={"difference"}
          ></Box>
        </Box>
        <Input
          width={"0%"}
          opacity={0}
          pos={"absolute"}
          zIndex={-10}
          tabIndex={-1}
          type="text"
          fontFamily={"monospace"}
          value={value}
          marginTop={"20px"}
          onChange={(e) => handleChange(e)}
          onInput={(e) => handleCursorPosition(e)}
          onKeyDown={(e) => handleKeyDown(e)}
          onClick={(e) => e.preventDefault()}
          onBlur={() => setBlink(false)}
          ref={textRef}
          autoFocus={true}
        />
      </Box>
    );
  },
);
