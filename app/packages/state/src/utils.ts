import { clone, Field, Schema, StrictField } from "@fiftyone/utilities";
import { MutableRefObject } from "react";
import { State } from "./recoil";

import { matchPath, RoutingContext } from "./routing";

export const deferrer =
  (initialized: MutableRefObject<boolean>) =>
  (fn: (...args: any[]) => void) =>
  (...args: any[]): void => {
    if (initialized.current) fn(...args);
  };

export const stringifyObj = (obj) => {
  if (typeof obj !== "object" || Array.isArray(obj)) return obj;
  return JSON.stringify(
    Object.keys(obj)
      .map((key) => {
        return [key, obj[key]];
      })
      .sort((a, b) => a[0] - b[0])
  );
};

export const filterView = (stages) =>
  JSON.stringify(
    stages.map(({ kwargs, _cls }) => ({
      kwargs: kwargs.filter((ka) => !ka[0].startsWith("_")),
      _cls,
    }))
  );

export const viewsAreEqual = (viewOne, viewTwo) => {
  return filterView(viewOne) === filterView(viewTwo);
};

const toStrictField = (field: Field): StrictField => {
  return {
    ...field,
    fields: Object.entries(field.fields).map(([_, f]) => toStrictField(f)),
  };
};

export const collapseFields = (paths): StrictField[] => {
  const schema: Schema = {};
  for (let i = 0; i < paths.length; i++) {
    const field = paths[i];
    const keys = field.path.split(".");
    let ref = schema;
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      ref[key] = ref[key] || ({ fields: {} } as Field);

      if (j === keys.length - 1) {
        ref[key] = {
          ...field,
          name: key,
          fields: ref[key].fields,
        };
      } else {
        ref = ref[key].fields;
      }
    }
  }

  return Object.entries(schema).map(([_, field]) => toStrictField(field));
};

const convertTargets = (
  targets: {
    target: string;
    value: string;
  }[]
) => {
  return Object.fromEntries(
    (targets || []).map(({ target, value }, i) => {
      if (!isNaN(Number(target))) {
        // masks targets is for non-rgb masks
        return [target, value];
      }

      // convert into RGB mask representation
      // offset of 1 in intTarget because 0 has a special significance
      return [target, { label: value, intTarget: i + 1 }];
    })
  );
};

export const transformDataset = (dataset: any): Readonly<State.Dataset> => {
  const targets = Object.fromEntries(
    (dataset?.maskTargets || []).map(({ name, targets }) => [
      name,
      convertTargets(targets),
    ])
  );

  const copy: any = clone(dataset);

  return {
    ...copy,
    defaultMaskTargets: convertTargets(dataset.defaultMaskTargets),
    brainMethods: [...dataset.brainMethods],
    evaluations: [...dataset.evaluations],
    maskTargets: targets,
    mediaType: dataset.mediaType,
  };
};

export const getDatasetSlug = (context: RoutingContext<any>): string => {
  const result = matchPath(
    context.pathname,
    {
      path: "/datasets/:slug",
      exact: true,
    },
    {},
    ""
  );
  if (result) {
    return decodeURIComponent(result.variables.slug);
  }

  return "";
};

export type ResponseFrom<TQuery extends { response: unknown }> =
  TQuery["response"];

export const getSavedViewName = (context: RoutingContext<any>): string => {
  const datasetSlug = getDatasetSlug(context);
  if (datasetSlug) {
    const queryString = context.history.location.search;
    const params = new URLSearchParams(queryString);
    const viewName = params.get("view");
    if (viewName) {
      return decodeURIComponent(viewName);
    }
  }

  return null;
};
