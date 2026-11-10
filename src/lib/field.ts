import { useStableId } from "./useStableId";

/**
 * The id of a form control and of the hint or error message under it: the consumer's `id` when there is one, else a
 * generated one that is the same on the server and in the browser. The message id is always `<id>-msg`.
 */
export function useFieldIds(id: string | undefined): { id: string; msgId: string } {
  const auto = useStableId("ds-f-");
  const own = id ?? auto;
  return { id: own, msgId: own + "-msg" };
}
