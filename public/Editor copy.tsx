import { pxToCh } from "../../utils";
import { Box, Input, Text } from "@chakra-ui/react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type TerminalProps = {
  characterWidth: number;
  systemInfoBanner: string;
  handleAction: (command: string) => void;
};

export const Editor: React.FC<TerminalProps> = ({
  characterWidth = 70,
  systemInfoBanner = "myMachine:>",
  handleAction,
}) => {
  const [value, setValue] = useState(" ".repeat(systemInfoBanner.length));
  const [lines, setLines] = useState<string[]>([""]);
  const [cursorOffset, setCursorOffset] = useState<number[]>([0, 0]);
  const [cursorPositionY, setCursorPositionY] = useState(0);
  const [blink, setBlink] = useState(true);
  const textRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<any>(null);

  const handleCursorPosition = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    let offset =
      target.value.length -
      (cursorOffset[1] * characterWidth - cursorOffset[0]);

    if (offset === 0) {
      return;
    }

    // if (offset % characterWidth === 0) {
    //   console.log(
    //     "moving down this should not be here",
    //     offset,
    //     offset / characterWidth,
    //   );
    setCursorPositionY(Math.floor(offset / characterWidth));
    // }
    // if (offset % characterWidth === characterWidth - 1) {
    //   setCursorPositionY(Math.floor(offset / characterWidth));
    //   console.log("moving up", Math.floor(offset / characterWidth));
    // }
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
  const handleMoveCursor = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    if (!allowedKeys.includes(e.code)) {
      return;
    }
    const lengthOfLastLine = lines[lines.length - 1]
      ? lines[lines.length - 1].length
      : 0;
    switch (e.code) {
      case "ArrowLeft":
        e.preventDefault();
        console.log("firingd");
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
            // lines[lines.length - 1 - Math.min(prev[1] + 1, cursorPositionY)]
            //   .length + cursorOffset[0],
            Math.min(prev[1] + 1, lines.length-1),

           // Math.min(prev[1] + 1, cursorPositionY),
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

        console.log("firingd");
        //stop the cursor when it hits the end
        if (cursorOffset[0] == 0 && cursorOffset[1] == 0) {
          break;
        }

        //cursor wrap
        if (lengthOfLastLine + cursorOffset[0] >= characterWidth - 1) {
          setCursorOffset((prev) => [
            lines.length - 1 - cursorOffset[1] == 0
              ? characterWidth - 1
              : 0 - lengthOfLastLine,
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

        console.log("firingd");
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
            Math.min(prev[1] + 1, lines.length-1), //from cursorPositionY
          ]);
          break;
        } else {
          setCursorOffset((prev) => [
            prev[0],
            Math.min(prev[1] + 1, lines.length-1), //from cursorPositionY
          ]);
          break;
        }
        break;
      case "ArrowDown":
        e.preventDefault();

        console.log("firingd");
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
        break;
      case "Backspace":
        if (
          target.value.length +
            cursorOffset[0] -
            systemInfoBanner.length -
            cursorOffset[1] * characterWidth <=
          0
        ) {
          e.preventDefault();
        } else {
          let offset =
            target.value.length -
            (cursorOffset[1] * characterWidth - cursorOffset[0]);

          console.log(
            "offsetx",
            cursorOffset[0],
            "offsetY",
            cursorOffset[1],
            "length",
            target.value.length,
            "curPosY",
            cursorPositionY,
          );
        }
        break;

      case "Enter":
        e.preventDefault();
        handleAction(target.value.trimStart());
        break;

      default:
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    blinker();
    const regExp = new RegExp(`.{1,${characterWidth}}`, "g");
    const chunks = e.target.value.match(regExp);
    setValue(e.target.value);
    setLines((chunks as string[]) || []);
  };

  const handleFocus = () => {
    if (textRef.current) {
      setBlink(true);
      textRef.current?.focus();
    }
  };

  // useEffect(() => {
  //   if (cursorOffset[1] <= 0) {
  //     setCursorOffset((prev) => [Math.min(prev[0], 0), prev[1]]);
  //   }
  // }, [cursorOffset[1]]);

  useLayoutEffect(() => {
    let caretPosition =
      value.length - (cursorOffset[1] * characterWidth - cursorOffset[0]);

    if (textRef.current) {
      textRef.current.focus();
      textRef.current?.setSelectionRange(caretPosition, caretPosition);
    }
  }, [cursorOffset[0], cursorOffset[1]]);

  useEffect(() => {
    // console.log("computing width", characterWidth);
    // pxToCh(window.innerWidth)
  }, []);

  return (
    <Box>
      <Box
        pos={"relative"}
        color={"white"}
        onClick={() => handleFocus()}
        w={`${characterWidth}ch`}
        fontSize={"1rem"}
      >
        <Text
          lineHeight={"1.5rem"}
          whiteSpace={"break-spaces"}
          pos={"relative"}
        >
          <Box as={"span"} pos={"absolute"} color={"red"}>
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
        // opacity={0}
        // pos={"absolute"}
        // zIndex={-10}
        type="text"
        fontFamily={"monospace"}
        value={value}
        marginTop={"20px"}
        onChange={(e) => handleChange(e)}
        onInput={(e) => handleCursorPosition(e)}
        onKeyDown={(e) => handleMoveCursor(e)}
        onClick={(e) => e.preventDefault()}
        onBlur={() => setBlink(false)}
        ref={textRef}
        autoFocus={true}
      />
    </Box>
  );
};
