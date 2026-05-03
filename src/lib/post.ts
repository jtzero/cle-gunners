export const isInHeader = (
  multimediaPlacement: string | undefined,
): boolean => {
  return !multimediaPlacement || multimediaPlacement == "header";
};
