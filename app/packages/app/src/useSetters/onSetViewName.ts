import { setView, setViewMutation } from "@fiftyone/relay";
import { datasetName, stateSubscription } from "@fiftyone/state";
import { DefaultValue } from "recoil";
import { commitMutation } from "relay-runtime";
import { pendingEntry } from "../Renderer";
import { resolveURL } from "../utils";
import { RegisteredSetter } from "./registerSetter";

const onSetViewName: RegisteredSetter =
  ({ environment, router, sessionRef }) =>
  ({ get, set }, newSlug: string | DefaultValue | null) => {
    set(pendingEntry, true);
    const slug = newSlug instanceof DefaultValue ? null : newSlug;

    const dataset = get(datasetName);
    if (!dataset) {
      throw new Error("no dataset");
    }

    commitMutation<setViewMutation>(environment, {
      mutation: setView,
      variables: {
        subscription: get(stateSubscription),
        view: [],
        savedViewSlug: slug,
        datasetName: dataset,
        form: {},
      },
      onCompleted: ({ setView: view }) => {
        sessionRef.current.selectedLabels = [];
        sessionRef.current.selectedSamples = new Set();
        sessionRef.current.fieldVisibilityStage = undefined;
        router.history.push(
          resolveURL({
            currentPathname: router.history.location.pathname,
            currentSearch: router.history.location.search,
            nextDataset: dataset,
            nextView: slug || undefined,
          }),
          {
            view,
          }
        );
      },
    });
  };

export default onSetViewName;
