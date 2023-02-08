import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import SearchIcon from "@mui/icons-material/Search";
import { useErrorHandler } from "react-error-boundary";

import {
  atom,
  selectorFamily,
  Snapshot,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from "recoil";

import { SORT_BY_SIMILARITY } from "../../utils/links";
import { useUnprocessedStateUpdate } from "@fiftyone/state";

import Checkbox from "../Common/Checkbox";
import Input from "../Common/Input";
import RadioGroup from "../Common/RadioGroup";

import Popout from "./Popout";
import { getFetchFunction, toSnakeCase } from "@fiftyone/utilities";

import {
  useTheme,
  PopoutSectionTitle,
  IconButton,
  Tooltip,
} from "@fiftyone/components";
import * as fos from "@fiftyone/state";
import { Button } from "../utils";
import styled from "styled-components";
import { ActionOption } from "./Common";

const getQueryIds = async (snapshot: Snapshot, brainKey?: string) => {
  const selectedLabelIds = await snapshot.getPromise(fos.selectedLabelIds);
  const selectedLabels = await snapshot.getPromise(fos.selectedLabels);
  const keys = await snapshot.getPromise(fos.similarityKeys);

  const labels_field = keys.patches
    .filter(([k, v]) => k === brainKey)
    .map(([k, v]) => v)[0];
  if (selectedLabelIds.size) {
    return [...selectedLabelIds].filter(
      (id) => selectedLabels[id].field === labels_field
    );
  }
  const selectedSamples = await snapshot.getPromise(fos.selectedSamples);
  const isPatches = await snapshot.getPromise(fos.isPatchesView);
  const modal = await snapshot.getPromise(fos.modal);

  if (isPatches) {
    if (selectedSamples.size) {
      return [...selectedSamples].map((id) => {
        const sample = fos.getSample(id);
        if (sample) {
          return sample.sample[labels_field]._id;
        }

        throw new Error("sample not found");
      });
    }

    return modal.sample[labels_field]._id;
  }

  if (selectedSamples.size) {
    return [...selectedSamples];
  }

  return modal.sample._id;
};

const useSortBySimilarity = (close) => {
  const update = useUnprocessedStateUpdate();
  const handleError = useErrorHandler();

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: fos.State.SortBySimilarityParameters) => {
        const queryIds = parameters.query
          ? null
          : await getQueryIds(snapshot, parameters.brainKey);
        const view = await snapshot.getPromise(fos.view);
        set(fos.similaritySorting, true);

        const { query, ...commonParams } = parameters;

        const combinedParameters = {
          ...commonParams,
        };

        combinedParameters["query"] = query ?? queryIds;

        try {
          const data = await getFetchFunction()("POST", "/sort", {
            dataset: await snapshot.getPromise(fos.datasetName),
            view,
            filters: await snapshot.getPromise(fos.filters),
            extended: toSnakeCase(combinedParameters),
          });

          // update selectedSamples atom to new set.
          // modifying data, otherwise useStateUpdate will set the selectedSamples again
          data.state.selected = [];

          update(({ set }) => {
            set(fos.similarityParameters, combinedParameters);
            set(fos.modal, null);
            set(fos.similaritySorting, false);
            close();

            return data;
          });
        } catch (error) {
          handleError(error);
        }
      },
    []
  );
};

const searchBrainKeyValue = atom<string>({
  key: "searchBrainKeyValue",
  default: "",
});

export const isImageSimilaritySearch = atom<boolean>({
  key: "isImageSimilaritySearch",
  default: false,
});

const availableSimilarityKeys = selectorFamily<string[], boolean>({
  key: "availableSimilarityKeys",
  get:
    (modal) =>
    ({ get }) => {
      const isPatches = get(fos.isPatchesView);
      const keys = get(fos.similarityKeys);
      if (!isPatches && !modal) {
        return keys.samples;
      } else if (!modal) {
        return keys.patches.reduce((acc, [key, field]) => {
          if (get(fos.labelPaths({})).includes(field)) {
            acc = [...acc, key];
          }
          return acc;
        }, []);
      } else if (modal) {
        const selectedLabels = get(fos.selectedLabels);

        if (Object.keys(selectedLabels).length) {
          const fields = new Set(
            Object.values(selectedLabels).map(({ field }) => field)
          );

          const patches = keys.patches
            .filter(([k, v]) => fields.has(v))
            .reduce((acc, [k]) => {
              return [...acc, k];
            }, []);
          return patches;
        } else if (isPatches) {
          const { sample } = get(fos.modal);

          return keys.patches
            .filter(([k, v]) => sample[v])
            .reduce((acc, [k]) => {
              return [...acc, k];
            }, []);
        }

        return keys.samples;
      }
      return [];
    },
});

const currentSimilarityKeys = selectorFamily<
  { total: number; choices: string[] },
  boolean
>({
  key: "currentSimilarityKeys",
  get:
    (modal) =>
    ({ get }) => {
      const searchBrainKey = get(searchBrainKeyValue);
      const keys = get(availableSimilarityKeys(modal));
      const result = keys.filter((k) => k.includes(searchBrainKey)).sort();

      return {
        total: keys.length,
        choices: result.slice(0, 11),
      };
    },
});

const sortType = selectorFamily<string, boolean>({
  key: "sortBySimilarityType",
  get:
    (modal) =>
    ({ get }) => {
      const isRoot = get(fos.isRootView);
      if (modal) {
        return "labels";
      } else if (isRoot) {
        return "images";
      } else {
        return "patches";
      }
    },
});

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  margin: auto 0;
`;

interface SortBySimilarityProps {
  modal: boolean;
  close: () => void;
  bounds?: any;
}

const SortBySimilarity = React.memo(
  ({ modal, bounds, close }: SortBySimilarityProps) => {
    const dataset = useRecoilValue(fos.dataset);
    const current = useRecoilValue(fos.similarityParameters);
    const selectedSamples = useRecoilValue(fos.selectedSamples);
    const [open, setOpen] = useState(false);
    const [isImageSearch, setIsImageSearch] = useRecoilState(
      isImageSimilaritySearch
    );
    const [state, setState] = useState<fos.State.SortBySimilarityParameters>(
      () =>
        current
          ? current
          : { brainKey: null, distField: null, reverse: false, k: 10 }
    );
    const hasNoSelectedSamples = [...selectedSamples].length == 0;
    const setParameter = useCallback(
      (name: string, value) =>
        setState((state) => ({ ...state, [name]: value })),
      []
    );

    const hasSorting = Boolean(current);
    const hasSimilarityKeys =
      useRecoilValue(availableSimilarityKeys(modal)).length > 0;
    const choices = useRecoilValue(currentSimilarityKeys(modal));
    const sortBySimilarity = useSortBySimilarity(close);
    const type = useRecoilValue(sortType(modal));

    const reset = useRecoilCallback(({ reset }) => () => {
      reset(fos.similarityParameters);
      reset(isImageSimilaritySearch);
    });

    const theme = useTheme();
    const refApply = React.useRef();
    const refInfo = React.useRef();
    const refSetting = React.useRef();

    useLayoutEffect(() => {
      choices.choices.length === 1 &&
        setParameter("brainKey", choices.choices[0]);
    }, [choices]);

    useLayoutEffect(() => {
      current && setState(current);
    }, [current]);

    useEffect(() => {
      if (!hasNoSelectedSamples) {
        setIsImageSearch(true);
      }
    }, [hasNoSelectedSamples]);

    const popoutStyle = { minWidth: 280 };

    const onInfoLink = () => {
      window.open(SORT_BY_SIMILARITY, "_system", "location=yes");
    };

    const brainKeySupportsPromps = dataset.brainMethods.some(
      (x) => x?.config?.supportsPrompts == true
    );
    const hasValidKeys =
      hasSimilarityKeys && (isImageSearch || brainKeySupportsPromps);
    const hasKeyButNotSupportTextPrompts =
      state.brainKey && hasSimilarityKeys && !brainKeySupportsPromps;

    return (
      <Popout modal={modal} bounds={bounds} style={popoutStyle}>
        {hasValidKeys && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "row",
            }}
          >
            {!isImageSearch && !hasSorting && (
              <Input
                placeholder={"Search by text"}
                validator={(value) => true}
                value={state.query || ""}
                setter={(value) => {
                  setParameter("query", value);
                }}
                disabled={!state.brainKey}
                onEnter={() => sortBySimilarity(state)}
              />
            )}
            {isImageSearch && !hasSorting && (
              <Button
                text={"Apply Sort"}
                title={`Sort by similarity to the selected ${type}`}
                onClick={() => {
                  sortBySimilarity(state);
                }}
                style={{
                  margin: "0.25rem",
                  height: "2rem",
                  borderRadius: 2,
                  textAlign: "center",
                  width: "185px",
                }}
              ></Button>
            )}
            {hasSorting && (
              <Button
                text={"Reset"}
                title={`Clear sorting`}
                onClick={() => {
                  close();
                  reset();
                }}
                style={{
                  margin: "0.25rem",
                  height: "2rem",
                  borderRadius: 2,
                  textAlign: "center",
                  width: "185px",
                }}
              ></Button>
            )}
            <ButtonGroup>
              {!isImageSearch && !hasSorting && (
                <Tooltip
                  text={`Sort by similarity to the selected ${type}`}
                  placement={"top-center"}
                >
                  <div ref={refApply} onClick={() => sortBySimilarity(state)}>
                    <IconButton
                      aria-label="submit"
                      size="small"
                      disableRipple
                      sx={{ color: "#2e7d32" }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </div>
                </Tooltip>
              )}
              <Tooltip
                text="Learn more about sorting by similarity"
                placement={"top-center"}
              >
                <div ref={refInfo} onClick={() => onInfoLink()}>
                  <IconButton
                    aria-label="information"
                    size="small"
                    disableRipple
                    sx={{ color: "#0288d1" }}
                  >
                    <InfoIcon />
                  </IconButton>
                </div>
              </Tooltip>
              <Tooltip text="Advanced Settings" placement={"top-center"}>
                <div ref={refSetting} onClick={() => setOpen((o) => !o)}>
                  <IconButton aria-label="Advanced Setting" size="small">
                    <SettingsIcon />
                  </IconButton>
                </div>
              </Tooltip>
            </ButtonGroup>
          </div>
        )}
        {!state.brainKey ||
          (!isImageSearch && hasKeyButNotSupportTextPrompts && (
            <>
              {hasKeyButNotSupportTextPrompts && (
                <PopoutSectionTitle style={{ fontSize: 12 }}>
                  Brain methods do not support text prompts.
                </PopoutSectionTitle>
              )}
              <PopoutSectionTitle>
                <ActionOption
                  href={SORT_BY_SIMILARITY}
                  text={"Sort by similarity"}
                  title={"About sorting by similarity"}
                  style={{
                    background: "unset",
                    color: theme.text.primary,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  svgStyles={{ height: "1rem", marginTop: 7.5 }}
                />
              </PopoutSectionTitle>
            </>
          ))}
        {open && hasValidKeys && (
          <div>
            <PopoutSectionTitle style={{ fontSize: 14 }}>
              Advanced Settings:
            </PopoutSectionTitle>
            <div>
              Find the{" "}
              <div style={{ width: "30px", display: "inline-block" }}>
                <Input
                  placeholder={"k"}
                  validator={(value) =>
                    value === "" || /^[0-9\b]+$/.test(value)
                  }
                  value={state.k === null ? "" : String(state.k)}
                  setter={(value) => {
                    setParameter("k", value === "" ? null : Number(value));
                  }}
                />
              </div>{" "}
              most similar samples,{" "}
              <Checkbox
                name={"in reverse order"}
                value={Boolean(state.reverse)}
                setValue={(v) => setParameter("reverse", v)}
              />
              with this brain key:
              <RadioGroup
                choices={choices.choices}
                value={state.brainKey}
                setValue={(v) => setParameter("brainKey", v)}
              />
            </div>
            Save the float field that stores the distance of each example to the
            speicified query as:
            <div style={{ width: "60%" }}>
              <Input
                placeholder={"dist_field (default = None)"}
                validator={(value) => !value.startsWith("_")}
                value={state.distField === null ? "" : state.distField}
                setter={(value) => {
                  setParameter("distField", value === "" ? null : value);
                }}
              />
            </div>
          </div>
        )}
      </Popout>
    );
  }
);

export default SortBySimilarity;
