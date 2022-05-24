/**
 * @generated SignedSource<<45119163ea25fbf897d0f6825485a3af>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from "relay-runtime";
export type SelectedLabel = {
  field: string;
  labelId: string;
  sampleId: string;
  frameNumber?: number | null;
};
export type setSelectedLabelsMutation$variables = {
  subscription: string;
  session?: string | null;
  selectedLabels: ReadonlyArray<SelectedLabel>;
};
export type setSelectedLabelsMutation$data = {
  readonly setSelectedLabels: boolean;
};
export type setSelectedLabelsMutation = {
  variables: setSelectedLabelsMutation$variables;
  response: setSelectedLabelsMutation$data;
};

const node: ConcreteRequest = (function () {
  var v0 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "selectedLabels",
    },
    v1 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "session",
    },
    v2 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "subscription",
    },
    v3 = [
      {
        alias: null,
        args: [
          {
            kind: "Variable",
            name: "selectedLabels",
            variableName: "selectedLabels",
          },
          {
            kind: "Variable",
            name: "session",
            variableName: "session",
          },
          {
            kind: "Variable",
            name: "subscription",
            variableName: "subscription",
          },
        ],
        kind: "ScalarField",
        name: "setSelectedLabels",
        storageKey: null,
      },
    ];
  return {
    fragment: {
      argumentDefinitions: [v0 /*: any*/, v1 /*: any*/, v2 /*: any*/],
      kind: "Fragment",
      metadata: null,
      name: "setSelectedLabelsMutation",
      selections: v3 /*: any*/,
      type: "Mutation",
      abstractKey: null,
    },
    kind: "Request",
    operation: {
      argumentDefinitions: [v2 /*: any*/, v1 /*: any*/, v0 /*: any*/],
      kind: "Operation",
      name: "setSelectedLabelsMutation",
      selections: v3 /*: any*/,
    },
    params: {
      cacheID: "bf598288c8d46b7377f6a78b34cf0126",
      id: null,
      metadata: {},
      name: "setSelectedLabelsMutation",
      operationKind: "mutation",
      text:
        "mutation setSelectedLabelsMutation(\n  $subscription: String!\n  $session: String\n  $selectedLabels: [SelectedLabel!]!\n) {\n  setSelectedLabels(subscription: $subscription, session: $session, selectedLabels: $selectedLabels)\n}\n",
    },
  };
})();

(node as any).hash = "fae0cda0b0e2376ff1e9c65cc3c9e03f";

export default node;
