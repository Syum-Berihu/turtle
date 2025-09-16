export type Style = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  foreground: string;
  background: string;
  faint: boolean;
  hidden: boolean;
  strikethrough: boolean;
};

export type State = {
  style: Style;
  cursor: {
    x: number;
    y: number;
    xSpec: number[];
    cursorTmp: number[];
  };
};

export type StyledText = {
  text: string;
  style: Style;
};

export type Lines = StyledText[][];

export type Command = {
  name:string
  result:string
}

export type Terminal = {
  id:string
  name:string
  inputValue: string;
  content:Command[]
}
