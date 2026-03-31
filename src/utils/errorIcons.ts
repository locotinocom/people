const ERROR_ICONS = [
  "🥺", // verängstigt
  "😢", // traurig
  "😟", // besorgt
  "😕", // fragend
  "🙁", // enttäuscht
];

export function getRandomErrorIcon(): string {
  const i = Math.floor(Math.random() * ERROR_ICONS.length);
  return ERROR_ICONS[i];
}