import onRefresh from "./onRefresh";
import onSetDataset from "./onSetDataset";
import onSetFieldVisibilityStage from "./onSetFieldVisibilityStage";
import onSetSimilarityParameters from "./onSetSimilarityParameters";
import onSetView from "./onSetView";
import onSetViewName from "./onSetViewName";
import registerSetter from "./registerSetter";

registerSetter("fieldVisibilityStage", onSetFieldVisibilityStage);
registerSetter("datasetName", onSetDataset);
registerSetter("refresh", onRefresh);
registerSetter("similarityParameters", onSetSimilarityParameters);
registerSetter("view", onSetView);
registerSetter("viewName", onSetViewName);

export { default } from "./useSetters";
