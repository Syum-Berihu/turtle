import { terminal256Colors, basicColors, brightColors } from "../utils/";
import { State, StyledText, Lines } from "../types";
import { useGlobalStore } from "../store";

let state: State = {
  style: {
    bold: false,
    italic: false,
    underline: false,
    foreground: "white",
    background: "none",
    faint: false,
    hidden: false,
    strikethrough: false,
  },
  cursor: {
    x: 0,
    y: 0,
    xSpec: [],
    cursorTmp: [],
  },
};

let lines: Lines = [];
export const useParseAnsi = () => {
  const eraseTab = useGlobalStore((state) => state.eraseTab);

  const calculateXspec = (xPos: number, line: StyledText[]) => {
    let pos = xPos;
    for (let item in line) {
      if (pos <= line[item].text.length) {
        return [Number(item), pos];
      }
      pos = pos - line[item].text.length;
    }
    return [-1, pos];
  };

  const excecuteFunction = {
    A: (args: string) => {
      console.log("moving cursor up");
      if (args === "") {
        state.cursor.y = Math.max(0, state.cursor.y - 1);
        return;
      }
      state.cursor.y = Math.max(0, state.cursor.y - Number(args));
      return;
    },

    B: (args: string) => {
      console.log("moving cursor down");
      if (args === "") {
        state.cursor.y = state.cursor.y + 1;
        return;
      }
      state.cursor.y = state.cursor.y + Number(args);

      return;
    },
    D: (args: string) => {
      console.log("moving cursor left");
      if (args === "") {
        state.cursor.x = Math.max(0, state.cursor.x - 1);
        return;
      }
      state.cursor.x = Math.max(0, state.cursor.x - Number(args));
      return;
    },

    C: (args: string) => {
      console.log("moving cursor right");
      if (args === "") {
        state.cursor.x = state.cursor.x + 1;
        return;
      }
      state.cursor.x = state.cursor.x + Number(args);
      return;
    },
    E: (args: string) => {
      console.log("cursor next line");
      if (args === "") {
        state.cursor.x = 0;
        state.cursor.y = Math.min(
          Object.keys(lines).length - 1,
          state.cursor.y + 1,
        );
        return;
      }
      state.cursor.x = 0;
      state.cursor.y = Math.min(
        Object.keys(lines).length - 1,
        state.cursor.y + Number(args),
      );
      return;
    },
    F: (args: string) => {
      console.log("cursor previous line");
      if (args === "") {
        state.cursor.x = 0;
        state.cursor.y = Math.max(0, state.cursor.y - 1);
        return;
      }
      state.cursor.x = 0;
      state.cursor.y = Math.max(0, state.cursor.y - Number(args));
      return;
    },

    G: (args: string) => {
      if (args === "") {
        state.cursor.x = 1;
        return;
      }
      state.cursor.x = Number(args);
      console.log("cursor horizontal abs");
      return;
    },
    H: (args: string) => {
      console.log("set cursor position");
      if (args === "") {
        state.cursor.x = 1;
        state.cursor.y = 1;
        return;
      }
      const parsedArgs = args.split(";");
      state.cursor.x = Number(parsedArgs[0]);
      state.cursor.y = Number(parsedArgs[1]);
      return;
    },
    J: (args: string) => {
      console.log("erase in display");
      j(args);
      return;
    },
    K: (args: string) => {
      console.log("erase in line");
      k(args);
      return;
    },
    S: () => {
      console.log("scroll up");
      return;
    },
    T: () => {
      console.log("scroll down");
      return;
    },
    s: () => {
      console.log("save cursor position");
      state.cursor.cursorTmp = [state.cursor.x, state.cursor.y];
      return;
    },
    u: (args: string) => {
      console.log("restore cursor position");
      state.cursor.x = state.cursor.cursorTmp[0];
      state.cursor.y = state.cursor.cursorTmp[1];
      return;
    },
    f: (args: string) => {
      console.log("same as M");
      m(args);
      return;
    },
    m: (args: string) => {
      m(args);
      return;
    },
  };

  const m = (arg: string) => {
    const args = arg === "" ? "0" : arg;
    //picking color index 0 true or false index 1 foregroudn or background
    let pickingColor = [0, 0];
    let colorAcc: string[] = [];

    //color pallete 0= 256 bit 1= rgb
    let palette = 0;

    const parsedArgs = args.split(";");
    parsedArgs.map((arg) => {
      if (pickingColor[0] === 0) {
        if (
          (Number(arg) >= 30 && Number(arg) <= 37) ||
          (Number(arg) >= 40 && Number(arg) <= 47)
        ) {
          state.style.foreground =
            Number(arg) < 40
              ? basicColors[`${Number(arg) % 10}` as keyof typeof basicColors]
              : state.style.foreground;
          state.style.background =
            Number(arg) > 39
              ? basicColors[`${Number(arg) % 10}` as keyof typeof basicColors]
              : state.style.background;
        } else if (
          (Number(arg) >= 90 && Number(arg) <= 97) ||
          (Number(arg) >= 100 && Number(arg) <= 107)
        ) {
          state.style.foreground =
            Number(arg) < 100
              ? brightColors[`${Number(arg) % 10}` as keyof typeof brightColors]
              : state.style.foreground;
          state.style.background =
            Number(arg) > 99
              ? brightColors[`${Number(arg) % 10}` as keyof typeof brightColors]
              : state.style.background;
        }
      }
      if ((pickingColor[0] && palette == 2) || palette == 5) {
        //if pickingColor[1] is 1 setbackground
        if (palette == 5) {
          state.style.foreground =
            pickingColor[1] == 0
              ? terminal256Colors[Number(arg) as keyof typeof terminal256Colors]
              : "white";
          state.style.background =
            pickingColor[1] == 1
              ? terminal256Colors[Number(arg) as keyof typeof terminal256Colors]
              : "none";
        } else if ((palette = 2)) {
          if (colorAcc.length >= 2) {
            state.style.foreground =
              pickingColor[1] == 0
                ? `rgb(${colorAcc[0]},${colorAcc[1]}, ${arg})`
                : "white";
            state.style.background =
              pickingColor[1] == 1
                ? `rgb(${colorAcc[0]},${colorAcc[1]}, ${arg})`
                : "none";
          } else {
            colorAcc.push(arg);
          }
        }
        //if pickingCOlor[1] is 0 setForeground
        console.log("i am picking a proper color", arg, pickingColor, palette);
        pickingColor = [0, 0];
        return;
      }
      switch (arg) {
        case "0":
          state.style.bold = false;
          state.style.italic = false;
          state.style.underline = false;
          state.style.foreground = "white";
          state.style.background = "none";
          break;
        case "1":
          state.style.bold = true;
          break;
        case "2":
          if (!pickingColor[0]) {
            state.style.faint = true;
            break;
          }
          palette = 2;
          break;
        case "3":
          state.style.italic = true;
          break;
        case "4":
          state.style.underline = true;
          break;
        case "5":
          if (!pickingColor[0]) {
            console.log("invalid argument");
            return;
          }
          palette = 5;
          break;
        case "8":
          state.style.hidden = true;
          break;
        case "9":
          state.style.strikethrough = true;
          break;
        case "22":
          state.style.bold = false;
          state.style.faint = false;
          break;
        case "23":
          state.style.italic = false;
          break;
        case "24":
          state.style.underline = false;
          break;
        case "28":
          state.style.hidden = false;
          break;
        case "29":
          state.style.strikethrough = false;
          break;
        case "38":
          pickingColor = [1, 0];
          break;
        case "39":
          pickingColor = [0, 0];
          state.style.foreground = "white";
          break;
        case "49":
          pickingColor = [0, 0];
          state.style.background = "none";
          break;
        case "48":
          pickingColor = [1, 1];
          break;
        default:
          break;
      }
    });
  };

  const k = (args: string) => {
    const arg = args === "" ? "0" : args;
    if (!lines[state.cursor.y] || lines[state.cursor.y].length <= 0) {
      return;
    }
    const lengthOfCurrentLine = lines[state.cursor.y].reduce((acc, item) => {
      return acc + item.text.length;
    }, 0);
    const [itemIndex, charOffset] = calculateXspec(
      state.cursor.x,
      lines[state.cursor.y],
    );
    const currentLine = [...lines[state.cursor.y]];
    switch (arg) {
      //if o, erase from cursor to end
      case "0":
        if (itemIndex == -1) {
          const newLine = currentLine.slice(
            0,
            lengthOfCurrentLine + charOffset,
          );
          lines[state.cursor.y] = newLine;
          break;
        }
        currentLine.splice(itemIndex + 1);
        if (
          charOffset < currentLine[itemIndex].text.length &&
          charOffset !== 0
        ) {
          currentLine[itemIndex].text = currentLine[itemIndex].text.slice(
            0,
            charOffset,
          );
        }
        lines[state.cursor.y] = currentLine;
        break;
      //if 1, erase from start of line to cursor
      case "1":
        if (itemIndex == -1) {
          currentLine.splice(0, lengthOfCurrentLine + charOffset);
          lines[state.cursor.y] = currentLine;
          break;
        }
        const newLine =
          currentLine[itemIndex].text.length == charOffset
            ? currentLine.slice(itemIndex + 1)
            : currentLine.slice(itemIndex);
        if (
          charOffset < currentLine[itemIndex].text.length &&
          charOffset !== 0
        ) {
          currentLine[itemIndex].text =
            currentLine[itemIndex].text.slice(charOffset);
        }
        console.log(newLine, "here comes the new line");
        lines[state.cursor.y] = newLine;
        break;
      //if 2, erase the whole line
      case "2":
        if (itemIndex == -1) {
          currentLine.splice(0, lengthOfCurrentLine + charOffset);
          lines[state.cursor.y] = currentLine;
          break;
        }
        currentLine.splice(0);
        lines[state.cursor.y] = currentLine;
        break;
      default:
        break;
    }
  };

  const renderText = (text: string) => {
    if (text.includes("\n")) {
      text.split("\n").forEach((item, idx) => {
        if (item !== "") {
          writeText(item);
        }
        if (idx === text.split("\n").length - 1 && item !== "") {
          return;
        }
        state.cursor.x = 0;
        state.cursor.y++;
      });
      return;
    }

    if (text.includes("\r")) {
      text.split("\r").forEach((item, idx) => {
        if (item !== "") {
          writeText(item);
        }
        if (idx === text.split("\r").length - 1 && item !== "") {
          return;
        }
        state.cursor.x = 0;
      });
      return;
    }

    writeText(text);
  };
  const insertInline = (
    xStart: number,
    target: StyledText[],
    newText: StyledText,
  ): StyledText[] => {
    const line = target ? [...target] : [];
    let insertPos = calculateXspec(xStart, line);
    if (!line[insertPos[0]] || !insertPos) {
      return [];
    }

    const [itemIndex, charOffset] = insertPos;
    const currentItem = line[itemIndex];
    const currentText = currentItem.text;

    //split line if changes are going to be contained in a single entry
    if (line[itemIndex].text.length - charOffset >= newText.text.length) {
      const beforeText = currentText.slice(0, charOffset);
      const afterText = currentText.slice(charOffset + newText.text.length);
      let newItems = [];

      if (beforeText !== "") {
        newItems.push({
          text: beforeText,
          style: line[itemIndex].style,
        });
      }
      newItems.push(newText);
      if (afterText !== "") {
        newItems.push({
          text: afterText,
          style: line[itemIndex].style,
        });
      }
      line.splice(itemIndex, 1, ...newItems);
      return line;
    }

    //if change is going to span multiple entries

    //amount of characters left undeleted in the cursor containing entry
    let deductable = line[itemIndex].text.length - insertPos[1] + 1;
    //chop down the line in the cursor index
    line[itemIndex].text = line[itemIndex].text.slice(0, insertPos[1]);

    const slicedLine = line.slice(itemIndex + 1);

    //loop over entries of slicedLine and check if the new text can fit in the current entry
    for (let i in slicedLine) {
      //if text is longer than the duductable + the Ith entry of slicedLine increase deductable and remove the entry
      if (newText.text.length - (deductable + slicedLine[i].text.length) > 0) {
        deductable = deductable + slicedLine[i].text.length;
        line.splice(itemIndex + 1, 1);
      }
    }

    //if length of array after the entry containing the cursor is 0 insert append the new text
    if (line.slice(itemIndex + 1).length < 1) {
      line.splice(itemIndex + 1, 0, newText);

      //if it is not empty slice the appropriate text
    } else {
      line[itemIndex + 1].text = line[itemIndex + 1].text.slice(
        newText.text.length - deductable,
      );
      line.splice(itemIndex + 1, 0, newText);
    }

    //return the line
    return line;
  };

  const writeText = (text: string) => {
    if (!lines[state.cursor.y]) {
      for (let i = 0; i <= state.cursor.y; i++) {
        lines[i] = lines[i] ?? [];
      }
    }
    const lengthOfCurrentLine = lines[state.cursor.y].reduce((acc, item) => {
      return acc + item.text.length;
    }, 0);

    if (lengthOfCurrentLine == state.cursor.x) {
      lines[state.cursor.y] = [
        ...lines[state.cursor.y],
        { text: text, style: { ...state.style } },
      ];
    }

    if (lengthOfCurrentLine > state.cursor.x) {
      lines[state.cursor.y] = insertInline(
        state.cursor.x,
        lines[state.cursor.y],
        { text: text, style: { ...state.style } },
      );
    }

    if (lengthOfCurrentLine < state.cursor.x) {
      lines[state.cursor.y] = [
        ...lines[state.cursor.y],
        {
          text: " ".repeat(Math.abs(lengthOfCurrentLine - state.cursor.x)),
          style: { ...state.style },
        },
        {
          text: text,
          style: { ...state.style },
        },
      ];
    }

    state.cursor.x = state.cursor.x + text.length;
  };

  const textToHtml = (cmdOutput: Lines): string => {
    let txt = "";
    let style = "";

    cmdOutput.forEach((line) => {
      line.forEach((item, idx) => {
        if (item.text.trim() === "") {
          style = "";
        } else {
          style =
            `color:${item.style.foreground}; ` +
            `background-color:${item.style.background}; ` +
            `font-weight:${item.style.bold ? "bold" : "normal"}; ` +
            `font-style:${item.style.italic ? "italic" : "normal"}; ` +
            `text-decoration:${
              item.style.underline && item.style.strikethrough
                ? "underline line-through"
                : item.style.underline
                  ? "underline"
                  : item.style.strikethrough
                    ? "line-through"
                    : "none"
            }; ` +
            `opacity:${item.style.hidden ? 0 : item.style.faint ? 0.5 : 1};`;
        }

        txt = txt + `<span style="${style}" key=${idx}> ${item.text} </span>`;
      });
      txt = txt + `</br>`;
    });

    return txt;
  };

  const replaceTextWithEscCodes = (text: string) => {
    return text
      .replace(/\\x1b/g, "\x1b")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r");
  };

  const j = (args: string) => {
    // const eraseTab = useGlobalStore((state) => state.eraseTab);
    const arg = args === "" ? "0" : args;
    switch (arg) {
      //erase sarting cursor to end of screen
      //erase starting cursor to begining of screen
      //erase everything
      case "0":
        excecuteFunction.K("0");
        lines.splice(state.cursor.y + 1);
        break;
      case "1":
        excecuteFunction.K("1");
        lines.splice(0, state.cursor.y);
        break;
      case "2":
        excecuteFunction.K("2");
        lines.splice(0, state.cursor.y);
        //add spaces to compensate
        break;
      case "3":
        excecuteFunction.K("2");
        lines.splice(0, state.cursor.y);
        eraseTab();
        break;
      default:
        break;
    }
    return;
  };

  const parseAnsiEscapes = (text: string) => {
    const func = /\u001b\[[0-9;]*[A-Za-z]/;
    const output = replaceTextWithEscCodes(text);
    lines = [];
    state = {
      style: {
        bold: false,
        italic: false,
        underline: false,
        foreground: "white",
        background: "transparent",
        faint: false,
        hidden: false,
        strikethrough: false,
      },
      cursor: {
        x: 0,
        y: 0,
        xSpec: [],
        cursorTmp: [],
      },
    };

    let startingIndex = 0;

    while (startingIndex !== -1) {
      const lastText = output.slice(
        startingIndex,
        output.indexOf("\u001b", startingIndex + 1),
      );

      const matchedFunc = lastText.match(func);

      if (!matchedFunc) {
        renderText(lastText);
      } else {
        excecuteFunction[
          matchedFunc[0][
            matchedFunc[0].length - 1
          ] as keyof typeof excecuteFunction
        ](matchedFunc[0].slice(2, matchedFunc[0].length - 1));

        if (lastText.slice(matchedFunc[0].length) !== "") {
          renderText(lastText.slice(matchedFunc[0].length));
        }
      }
      startingIndex =
        output.indexOf("\u001B", startingIndex + 1) == -1
          ? -1
          : output.indexOf("\u001B", startingIndex + 1);
    }
    return lines;
  };

  return { parseAnsiEscapes, textToHtml };
};
