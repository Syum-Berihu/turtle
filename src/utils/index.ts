import { nanoid } from "nanoid"

export * from "./generateName"
export * from "./terminalColors"

export const pxToCh = (width:number) =>{
  const span = document.createElement("span")
  span.style.visibility = "hidden"
  span.style.position = "absolute"
  span.style.fontFamily = "monospace"
  span.textContent = '0'
  span.style.fontSize = "1rem"
  span.style.padding= '0'
  span.style.margin ='0'
  document.body.append(span)
  const chWidth = span.getBoundingClientRect().width
  document.body.removeChild(span)
  return width/chWidth
}


export const generateId = () => {
  return nanoid(15)
}
