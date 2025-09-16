import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  colors,
} from "unique-names-generator";

export const generateName = () => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
  });
};
